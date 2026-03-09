const OVERPASS_ENDPOINTS = [
  "https://overpass-api.de/api/interpreter",
  "https://overpass.kumi.systems/api/interpreter",
  "https://overpass.openstreetmap.ru/api/interpreter",
  "https://overpass.osm.ch/api/interpreter",
];

const AMENITY_VALUES = "restaurant|fast_food|food_court|cafe|ice_cream|bar|pub|biergarten|marketplace";
const SHOP_VALUES =
  "bakery|confectionery|pastry|ice_cream|chocolate|deli|supermarket|convenience|butcher|seafood|greengrocer|alcohol|tea|coffee|beverages|cheese|farm|health_food|spices|herbalist|dairy";

function buildQuery([south, west, north, east]) {
  const lines = [];
  ["node", "way", "rel"].forEach((type) => {
    lines.push(`${type}["amenity"~"^(${AMENITY_VALUES})$"](${south},${west},${north},${east});`);
    lines.push(`${type}["shop"~"^(${SHOP_VALUES})$"](${south},${west},${north},${east});`);
  });
  return `[out:json][timeout:40];\n(\n${lines.join("\n")}\n);\nout center;`;
}

export async function fetchFoodCandidates(bbox) {
  const query = buildQuery(bbox);
  let lastError;

  for (const endpoint of OVERPASS_ENDPOINTS) {
    try {
      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
          Accept: "application/json",
        },
        body: `data=${encodeURIComponent(query)}`,
      });

      if (!response.ok) {
        throw new Error(`${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      return data.elements || [];
    } catch (error) {
      lastError = error;
    }
  }

  throw new Error(`API 取得失敗: ${lastError?.message || "unknown"}`);
}
