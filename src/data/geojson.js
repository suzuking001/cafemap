function isValidPointFeature(feature) {
  return (
    feature &&
    feature.geometry &&
    feature.geometry.type === "Point" &&
    Array.isArray(feature.geometry.coordinates) &&
    feature.geometry.coordinates.length === 2 &&
    feature.properties &&
    feature.properties.category
  );
}

export function normalizeFeatureCollection(data) {
  if (!data || data.type !== "FeatureCollection" || !Array.isArray(data.features)) {
    throw new Error("GeoJSON FeatureCollection ではありません");
  }

  const features = data.features.filter(isValidPointFeature);
  if (features.length === 0) {
    throw new Error("Point かつ properties.category 付き要素が見つかりません");
  }

  const normalized = { type: "FeatureCollection", features };
  if (data.meta && typeof data.meta === "object") {
    normalized.meta = data.meta;
  }
  return normalized;
}

export async function readGeoJSONFile(file) {
  const text = await file.text();
  return normalizeFeatureCollection(JSON.parse(text));
}

export function downloadGeoJSON(data, prefix = "foodmap") {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  const stamp = new Date().toISOString().replace(/[:.]/g, "-");

  link.href = url;
  link.download = `${prefix}_${stamp}.geojson`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}
