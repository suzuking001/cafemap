import { fetchFoodCandidates } from "../data/overpass.js";

const { L, turf, chroma } = window;

function clearRenderedLayers(map, state) {
  if (state.gridLayer) {
    map.removeLayer(state.gridLayer);
    state.gridLayer = null;
  }

  if (state.labelLayer) {
    map.removeLayer(state.labelLayer);
    state.labelLayer = null;
  }

  Object.values(state.pointLayers).forEach((layer) => {
    map.removeLayer(layer);
  });
  state.pointLayers = {};
}

function getMapBounds(map) {
  const bounds = map.getBounds();
  return [bounds.getSouth(), bounds.getWest(), bounds.getNorth(), bounds.getEast()];
}

function collectLoadedFeatures(selectedCategories, loadedDataset) {
  const categoryPoints = Object.fromEntries(selectedCategories.map((category) => [category.id, []]));
  const allFeatures = [];

  loadedDataset.features.forEach((feature) => {
    if (!feature || feature.geometry?.type !== "Point") {
      return;
    }

    const categoryId = feature.properties?.category;
    if (!categoryId || !(categoryId in categoryPoints)) {
      return;
    }

    const [lon, lat] = feature.geometry.coordinates;
    const point = turf.point([lon, lat], feature.properties || {});
    categoryPoints[categoryId].push(point);
    allFeatures.push(point);
  });

  return { categoryPoints, allFeatures };
}

function classifyFetchedFeatures(selectedCategories, elements) {
  const categoryPoints = Object.fromEntries(selectedCategories.map((category) => [category.id, []]));
  const allFeatures = [];
  const pushPoint = (categoryId, point) => {
    if (!(categoryId in categoryPoints)) {
      return;
    }
    point.properties = { category: categoryId, ...(point.properties || {}) };
    categoryPoints[categoryId].push(point);
    allFeatures.push(point);
  };

  const otherSelected = Boolean(categoryPoints.others);
  const normalCategories = selectedCategories.filter((category) => category.id !== "others");

  elements.forEach((element) => {
    const lat = element.lat ?? element.center?.lat;
    const lon = element.lon ?? element.center?.lon;
    if (lat == null || lon == null) {
      return;
    }

    const tags = element.tags || {};
    const name = tags.name || "";
    const point = turf.point([lon, lat], tags);
    let matched = false;

    normalCategories.forEach((category) => {
      if (typeof category.test === "function" && category.test(tags, name)) {
        pushPoint(category.id, point);
        matched = true;
      }
    });

    if (!matched && otherSelected) {
      pushPoint("others", point);
    }
  });

  return { categoryPoints, allFeatures };
}

function buildGrid(categoryPoints, weights, bbox, gridSizeKm) {
  const grid = turf.squareGrid([bbox[1], bbox[0], bbox[3], bbox[2]], gridSizeKm, {
    units: "kilometers",
  });
  const scores = [];

  grid.features.forEach((cell) => {
    let score = 0;
    Object.entries(categoryPoints).forEach(([categoryId, points]) => {
      const weight = weights[categoryId];
      if (!weight) {
        return;
      }

      points.forEach((point) => {
        if (turf.booleanPointInPolygon(point, cell)) {
          score += weight;
        }
      });
    });

    cell.properties.score = score;
    scores.push(score);
  });

  const average = scores.reduce((sum, value) => sum + value, 0) / scores.length;
  const deviation = Math.sqrt(scores.reduce((sum, value) => sum + (value - average) ** 2, 0) / scores.length) || 1e-9;
  grid.features.forEach((feature) => {
    feature.properties.dev = Math.round(50 + (10 * (feature.properties.score - average)) / deviation);
  });

  return { grid, scores };
}

function createGridLayers(grid, scores) {
  const colorScale = chroma.scale("YlOrRd").domain([0, Math.max(...scores) || 1]);
  const gridLayer = L.geoJson(grid, {
    style: (feature) => ({
      fillColor: colorScale(feature.properties.score).hex(),
      color: "#444",
      weight: 0.4,
      fillOpacity: 0.55,
    }),
    onEachFeature: (feature, layer) => {
      layer.bindPopup(`Score: ${feature.properties.score.toFixed(2)}<br>偏差値: ${feature.properties.dev}`);
    },
  });

  const labelLayer = L.layerGroup();
  grid.features.forEach((feature) => {
    const [lon, lat] = turf.centerOfMass(feature).geometry.coordinates;
    L.marker([lat, lon], {
      icon: L.divIcon({
        className: "dev-label",
        html: feature.properties.dev,
        iconSize: [24, 12],
      }),
    }).addTo(labelLayer);
  });

  return { gridLayer, labelLayer };
}

function createPointLayers(selectedCategories, categoryPoints) {
  return Object.fromEntries(
    selectedCategories
      .filter((category) => categoryPoints[category.id]?.length)
      .map((category) => [
        category.id,
        L.geoJson(turf.featureCollection(categoryPoints[category.id]), {
          pointToLayer: (_feature, latLng) =>
            L.circleMarker(latLng, {
              radius: 3,
              color: category.color,
              weight: 0.6,
              fillOpacity: 0.85,
            }),
        }),
      ]),
  );
}

function findTopCategory(categoryPoints) {
  let topCategoryId = null;
  let topCount = 0;

  Object.entries(categoryPoints).forEach(([categoryId, points]) => {
    if (points.length >= topCount && points.length > 0) {
      topCategoryId = categoryId;
      topCount = points.length;
    }
  });

  return topCategoryId;
}

export async function renderHeatmap({
  map,
  state,
  selectedCategories,
  weights,
  gridSizeKm,
  loadedDataset,
  useLoaded,
  pointsVisible,
}) {
  clearRenderedLayers(map, state);

  const bbox = getMapBounds(map);
  const sourceData = useLoaded
    ? collectLoadedFeatures(selectedCategories, loadedDataset)
    : classifyFetchedFeatures(selectedCategories, await fetchFoodCandidates(bbox));

  if (!Object.values(sourceData.categoryPoints).some((points) => points.length)) {
    throw new Error("該当施設なし（読み込みデータ/選択カテゴリの組み合わせ）");
  }

  if (!useLoaded && sourceData.allFeatures.length === 0) {
    throw new Error("該当施設が見つかりませんでした");
  }

  const { grid, scores } = buildGrid(
    sourceData.categoryPoints,
    weights,
    bbox,
    Math.max(0.1, Math.min(5, gridSizeKm)),
  );
  const { gridLayer, labelLayer } = createGridLayers(grid, scores);
  const pointLayers = createPointLayers(selectedCategories, sourceData.categoryPoints);

  state.gridLayer = gridLayer.addTo(map);
  state.labelLayer = labelLayer.addTo(map);
  state.pointLayers = pointLayers;

  if (pointsVisible) {
    Object.values(pointLayers).forEach((layer) => layer.addTo(map));
  }

  const lastExport = useLoaded
    ? loadedDataset
    : {
        type: "FeatureCollection",
        features: sourceData.allFeatures.map((feature) => feature),
        meta: {
          created: new Date().toISOString(),
          bbox,
          categories: selectedCategories.map((category) => category.id),
        },
      };

  return {
    lastExport,
    topCategory: findTopCategory(sourceData.categoryPoints),
  };
}
