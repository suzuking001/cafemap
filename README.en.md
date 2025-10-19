Foodie Heatmap (Category-weighted, Standard Score)

This is a single-page app that fetches food-related POIs from OpenStreetMap (via Overpass API) for the current map view, weights them by category, aggregates per grid cell, and visualizes both a color heatmap and cell labels using a standard score (50 ± 10).

- Toggle heatmap, labels, and points
- Adjust grid size (km)
- Save results as GeoJSON / Load external GeoJSON

**Features**
- Pure client-side app powered by Leaflet
- Fetches `amenity` / `shop` targets from Overpass API (tries multiple endpoints for redundancy)
- Per-category checkboxes and weight sliders (0.0–1.0)
- Computes mean and stddev over cell scores → shows standard score (scaled to 50±10)
- Export current result to GeoJSON or re-render from an imported GeoJSON

**Run locally**
- Opening `index.html` directly works, but Geolocation requires HTTPS or `http://localhost`.
- Prefer serving with a simple HTTP server:
  - Python: `python -m http.server 8080` → open `http://localhost:8080/`
  - Node (serve): `npx serve .` → open the displayed URL

**Usage**
- Move the map to your area of interest (quick jump with the locate button)
- Select categories and tune weights with sliders
- Use toggles for heatmap/labels/points and adjust grid size
- Click the Generate button to aggregate and render
- Save the result to GeoJSON or load an external GeoJSON and render it

**How it works**
- Builds an Overpass query for the current map bounding box to fetch relevant POIs
- Creates a square grid with the chosen cell width (km) and sums weights of points inside each cell as the score
- Derives standard scores (50 ± 10) from the score distribution and shows them as labels

**Key code locations**
- Category definitions and matching: `index.html:258`
- Map/tile initialization: `index.html:328`
- Geolocation button handling: `index.html:420`
- Heatmap generation (fetch → aggregate → render): `index.html:449`
- GeoJSON export: `index.html:579`

**Data and licenses**
- Map data: © OpenStreetMap contributors (ODbL)
- Tiles: tile.openstreetmap.org (respect OSMF tile usage policy)

**Libraries**
- Leaflet (BSD-2-Clause)
- Turf.js (MIT)
- chroma.js (BSD-3-Clause)

**Notes and limitations**
- Overpass API has rate limits; avoid high-frequency calls. If requests fail, wait and retry.
- Geolocation works only on HTTPS or `http://localhost` and depends on browser/OS settings.
- Redistribution of OSM-derived data (including exported GeoJSON) must follow ODbL and relevant terms.
- Respect tile server policies; consider alternative providers for heavy traffic.

**Customize**
- Add/modify categories (label/color/matching) in `CATS` within `index.html`.
- Adjust default grid width and UI labels within `index.html` as needed.

**Deploy (GitHub Pages)**
- Push to GitHub → Settings → Pages → set Branch (e.g. `main` or `docs`) → the published URL will serve `index.html` directly.
- Use the HTTPS URL if you need Geolocation.

**Screenshots**
- Put images under `assets/` and reference them like: `![Top](assets/screenshot-1.png)`
