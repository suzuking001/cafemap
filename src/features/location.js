const { L } = window;

function updateUserLocation(state, lat, lon, accuracy) {
  const latLng = [lat, lon];
  const radius = Math.max(10, Math.min(500, Number(accuracy || 50)));

  if (!state.userMarker) {
    state.userMarker = L.circleMarker(latLng, {
      radius: 6,
      color: "#4ea1ff",
      weight: 2,
      fillColor: "#4ea1ff",
      fillOpacity: 0.9,
    }).addTo(state.userLayer);
  } else {
    state.userMarker.setLatLng(latLng);
  }

  if (!state.userAccCircle) {
    state.userAccCircle = L.circle(latLng, {
      radius,
      color: "#4ea1ff",
      weight: 1,
      fillColor: "#4ea1ff",
      fillOpacity: 0.15,
    }).addTo(state.userLayer);
  } else {
    state.userAccCircle.setLatLng(latLng);
    state.userAccCircle.setRadius(radius);
  }
}

export function bindLocateButton({ buttonEl, map, state, showToast }) {
  buttonEl.addEventListener("click", () => {
    if (!("geolocation" in navigator)) {
      showToast("現在地にアクセスできません（未対応端末）。", "error");
      return;
    }

    const options = { enableHighAccuracy: true, maximumAge: 5000, timeout: 10000 };
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude, accuracy } = position.coords;
        updateUserLocation(state, latitude, longitude, accuracy);
        map.setView([latitude, longitude], Math.max(16, map.getZoom()));

        if (state.geoWatchId === null) {
          state.geoWatchId = navigator.geolocation.watchPosition(
            (watchPosition) => {
              const { latitude: nextLat, longitude: nextLon, accuracy: nextAccuracy } = watchPosition.coords;
              updateUserLocation(state, nextLat, nextLon, nextAccuracy);
            },
            (error) => {
              console.warn("watchPosition error", error);
            },
            options,
          );
        }
      },
      (error) => {
        showToast(`現在地エラー: ${error.message || error}`, "error");
      },
      options,
    );
  });
}
