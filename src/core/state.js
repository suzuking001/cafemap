const { L } = window;

export function createAppState(map) {
  return {
    map,
    gridLayer: null,
    labelLayer: null,
    pointLayers: {},
    loadedDataset: null,
    lastExport: null,
    userLayer: L.layerGroup().addTo(map),
    userMarker: null,
    userAccCircle: null,
    geoWatchId: null,
  };
}
