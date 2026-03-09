const { L } = window;

function setLayerVisibility(map, layer, visible) {
  if (!layer) {
    return;
  }

  const isVisible = map.hasLayer(layer);
  if (visible && !isVisible) {
    map.addLayer(layer);
  }
  if (!visible && isVisible) {
    map.removeLayer(layer);
  }
}

export function createBaseMap(containerId) {
  const map = L.map(containerId, { zoomControl: true }).setView([35.6812, 139.7671], 14);

  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    maxZoom: 19,
    attribution: "&copy; OpenStreetMap contributors",
  }).addTo(map);

  map.zoomControl.setPosition("topright");
  return map;
}

export function syncHeatLayerVisibility({ map, state, showHeat, showLabels }) {
  setLayerVisibility(map, state.gridLayer, showHeat);
  setLayerVisibility(map, state.labelLayer, showHeat && showLabels);
}

export function syncPointLayerVisibility({ map, state, visible }) {
  Object.values(state.pointLayers).forEach((layer) => {
    setLayerVisibility(map, layer, visible);
  });
}
