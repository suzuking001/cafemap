const FOOD_PLACE_RE = /^(restaurant|fast_food|food_court)$/;
const DINING_RE = /^(restaurant|food_court)$/;
const BAR_LIKE_RE = /^(bar|pub|biergarten)$/;
const IZAKAYA_RE = /^(restaurant|pub|bar|biergarten)$/;

function amenityMatches(tags, pattern) {
  return pattern.test(tags.amenity || "");
}

function shopMatches(tags, pattern) {
  return pattern.test(tags.shop || "");
}

function cuisineMatches(tags, pattern) {
  return pattern.test((tags.cuisine || "").toLowerCase());
}

function nameMatches(name, pattern) {
  return pattern.test(name || "");
}

const categories = [
  {
    id: "curry",
    label: "カレー",
    color: "#d97706",
    clauses: ['["amenity"~"^(restaurant|fast_food|food_court)$"]'],
    test: (tags, name) =>
      amenityMatches(tags, FOOD_PLACE_RE) &&
      (cuisineMatches(tags, /curry/) ||
        cuisineMatches(tags, /(indian|nepalese|pakistani|sri ?lankan)/) ||
        nameMatches(name, /カレー|印度|インド|ネパール|スリランカ/i)),
  },
  {
    id: "ramen",
    label: "ラーメン",
    color: "#e11d48",
    clauses: ['["amenity"~"^(restaurant|fast_food|food_court)$"]'],
    test: (tags, name) =>
      amenityMatches(tags, FOOD_PLACE_RE) &&
      (cuisineMatches(tags, /(ramen|noodle)/i) || nameMatches(name, /ラーメン|拉麺/i)),
  },
  {
    id: "sushi",
    label: "寿司",
    color: "#0ea5e9",
    clauses: ['["amenity"~"^(restaurant|food_court)$"]'],
    test: (tags, name) =>
      amenityMatches(tags, DINING_RE) &&
      (cuisineMatches(tags, /sushi/) || nameMatches(name, /寿司|鮨|すし|回転寿司/i)),
  },
  {
    id: "patisserie",
    label: "パティスリー",
    color: "#f472b6",
    clauses: ['["shop"~"^(confectionery|pastry)$"]', '["amenity"="cafe"]'],
    test: (tags, name) =>
      shopMatches(tags, /^(confectionery|pastry)$/) ||
      (tags.amenity === "cafe" && nameMatches(name, /patisserie|ケーキ|洋菓子|スイーツ/i)),
  },
  {
    id: "bakery",
    label: "ベーカリー",
    color: "#a16207",
    clauses: ['["shop"="bakery"]', '["amenity"="cafe"]'],
    test: (tags, name) =>
      tags.shop === "bakery" || (tags.amenity === "cafe" && nameMatches(name, /パン|ベーカリー|boulangerie|bakery/i)),
  },
  {
    id: "confectionery",
    label: "和菓子・菓子",
    color: "#22c55e",
    clauses: ['["shop"~"^(confectionery|chocolate)$"]'],
    test: (tags, name) =>
      shopMatches(tags, /^(confectionery|chocolate)$/) ||
      nameMatches(name, /和菓子|饅頭|最中|羊羹|大福|チョコ|ショコラ/i),
  },
  {
    id: "ice_cream",
    label: "アイス",
    color: "#60a5fa",
    clauses: ['["amenity"="ice_cream"]', '["shop"="ice_cream"]'],
    test: (tags, name) =>
      tags.amenity === "ice_cream" || tags.shop === "ice_cream" || nameMatches(name, /gelato|ジェラート|アイス/i),
  },
  {
    id: "cafe",
    label: "カフェ",
    color: "#8b5cf6",
    clauses: ['["amenity"="cafe"]'],
    test: (tags, name) => tags.amenity === "cafe" || nameMatches(name, /カフェ|喫茶|coffee|コーヒー/i),
  },
  {
    id: "restaurant",
    label: "レストラン",
    color: "#fb7185",
    clauses: ['["amenity"="restaurant"]'],
    test: (tags) => tags.amenity === "restaurant",
  },
  {
    id: "soba_udon",
    label: "そば・うどん",
    color: "#14b8a6",
    clauses: ['["amenity"~"^(restaurant|fast_food|food_court)$"]'],
    test: (tags, name) =>
      amenityMatches(tags, FOOD_PLACE_RE) &&
      (cuisineMatches(tags, /soba|udon/) || nameMatches(name, /そば|蕎麦|うどん/)),
  },
  {
    id: "tempura",
    label: "天ぷら",
    color: "#ca8a04",
    clauses: ['["amenity"~"^(restaurant|fast_food|food_court)$"]'],
    test: (tags, name) =>
      amenityMatches(tags, FOOD_PLACE_RE) &&
      (cuisineMatches(tags, /tempura/) || nameMatches(name, /天ぷら|てんぷら/)),
  },
  {
    id: "tonkatsu",
    label: "とんかつ",
    color: "#b45309",
    clauses: ['["amenity"~"^(restaurant|fast_food|food_court)$"]'],
    test: (tags, name) =>
      amenityMatches(tags, FOOD_PLACE_RE) &&
      (cuisineMatches(tags, /tonkatsu|katsu/) || nameMatches(name, /とんかつ|カツ/)),
  },
  {
    id: "yakiniku",
    label: "焼肉",
    color: "#ef4444",
    clauses: ['["amenity"~"^(restaurant|fast_food|food_court)$"]'],
    test: (tags, name) =>
      amenityMatches(tags, FOOD_PLACE_RE) &&
      (cuisineMatches(tags, /yakiniku|bbq/) || nameMatches(name, /焼肉/)),
  },
  {
    id: "yakitori",
    label: "焼き鳥",
    color: "#dc2626",
    clauses: ['["amenity"~"^(restaurant|fast_food|food_court)$"]'],
    test: (tags, name) => amenityMatches(tags, FOOD_PLACE_RE) && nameMatches(name, /焼鳥|焼き鳥|やきとり/),
  },
  {
    id: "okonomiyaki",
    label: "お好み焼・もんじゃ",
    color: "#ea580c",
    clauses: ['["amenity"~"^(restaurant|fast_food|food_court)$"]'],
    test: (tags, name) =>
      amenityMatches(tags, FOOD_PLACE_RE) &&
      (cuisineMatches(tags, /okonomiyaki|monja|teppanyaki/) || nameMatches(name, /お好み|もんじゃ/)),
  },
  {
    id: "burger",
    label: "ハンバーガー",
    color: "#f59e0b",
    clauses: ['["amenity"~"^(restaurant|fast_food|food_court)$"]'],
    test: (tags, name) =>
      amenityMatches(tags, FOOD_PLACE_RE) &&
      (cuisineMatches(tags, /burger/) || nameMatches(name, /ハンバーガー|バーガー|burger/i)),
  },
  {
    id: "pizza",
    label: "ピザ",
    color: "#84cc16",
    clauses: ['["amenity"~"^(restaurant|fast_food|food_court)$"]'],
    test: (tags, name) =>
      amenityMatches(tags, FOOD_PLACE_RE) &&
      (cuisineMatches(tags, /pizza/) || nameMatches(name, /ピザ|pizzeria/i)),
  },
  {
    id: "steak",
    label: "ステーキ",
    color: "#f97316",
    clauses: ['["amenity"~"^(restaurant|fast_food|food_court)$"]'],
    test: (tags, name) =>
      amenityMatches(tags, FOOD_PLACE_RE) &&
      (cuisineMatches(tags, /steak/) || nameMatches(name, /ステーキ/i)),
  },
  {
    id: "chinese",
    label: "中華",
    color: "#ef4444",
    clauses: ['["amenity"~"^(restaurant|fast_food|food_court)$"]'],
    test: (tags, name) =>
      amenityMatches(tags, FOOD_PLACE_RE) &&
      (cuisineMatches(tags, /chinese|sichuan|cantonese|taiwanese/) || nameMatches(name, /中華|中国|餃子|小籠包/)),
  },
  {
    id: "korean",
    label: "韓国",
    color: "#22c55e",
    clauses: ['["amenity"~"^(restaurant|fast_food|food_court)$"]'],
    test: (tags, name) =>
      amenityMatches(tags, FOOD_PLACE_RE) &&
      (cuisineMatches(tags, /korean/) || nameMatches(name, /韓国|コリア|キムチ/)),
  },
  {
    id: "thai_vietnamese",
    label: "タイ・ベトナム",
    color: "#10b981",
    clauses: ['["amenity"~"^(restaurant|fast_food|food_court)$"]'],
    test: (tags, name) =>
      amenityMatches(tags, FOOD_PLACE_RE) &&
      (cuisineMatches(tags, /(thai|vietnamese|lao|laotian)/) || nameMatches(name, /タイ|ベトナム|フォー|トムヤム|バインミー/)),
  },
  {
    id: "seafood_restaurant",
    label: "海鮮料理",
    color: "#06b6d4",
    clauses: ['["amenity"~"^(restaurant|food_court)$"]'],
    test: (tags, name) =>
      amenityMatches(tags, DINING_RE) &&
      (cuisineMatches(tags, /seafood|fish/) || nameMatches(name, /海鮮|魚介/)),
  },
  {
    id: "izakaya",
    label: "居酒屋",
    color: "#8b5cf6",
    clauses: ['["amenity"~"^(restaurant|pub|bar|biergarten)$"]'],
    test: (tags, name) => amenityMatches(tags, IZAKAYA_RE) && nameMatches(name, /居酒屋|やきとん|大衆酒場/),
  },
  {
    id: "bar_pub",
    label: "バー・パブ",
    color: "#a855f7",
    clauses: ['["amenity"~"^(bar|pub|biergarten)$"]'],
    test: (tags, name) => amenityMatches(tags, BAR_LIKE_RE) || nameMatches(name, /バー|パブ|ビア/),
  },
  {
    id: "tea_bubbletea",
    label: "お茶・タピオカ",
    color: "#22d3ee",
    clauses: ['["amenity"="cafe"]', '["shop"~"^(tea|beverages|coffee)$"]'],
    test: (tags, name) =>
      tags.amenity === "cafe" ||
      shopMatches(tags, /^(tea|beverages|coffee)$/) ||
      cuisineMatches(tags, /(bubble|boba)/i) ||
      nameMatches(name, /タピ|タピオカ|茶|ティー/),
  },
  {
    id: "supermarket",
    label: "スーパー",
    color: "#0ea5e9",
    clauses: ['["shop"="supermarket"]'],
    test: (tags) => tags.shop === "supermarket",
  },
  {
    id: "convenience",
    label: "コンビニ",
    color: "#3b82f6",
    clauses: ['["shop"="convenience"]'],
    test: (tags) => tags.shop === "convenience",
  },
  {
    id: "greengrocer",
    label: "八百屋",
    color: "#16a34a",
    clauses: ['["shop"="greengrocer"]'],
    test: (tags) => tags.shop === "greengrocer",
  },
  {
    id: "butcher",
    label: "精肉店",
    color: "#ef4444",
    clauses: ['["shop"="butcher"]'],
    test: (tags) => tags.shop === "butcher",
  },
  {
    id: "fishmonger",
    label: "鮮魚店",
    color: "#60a5fa",
    clauses: ['["shop"="seafood"]'],
    test: (tags) => tags.shop === "seafood",
  },
  {
    id: "alcohol_shop",
    label: "酒屋",
    color: "#d946ef",
    clauses: ['["shop"~"^(alcohol|beverages)$"]'],
    test: (tags) => shopMatches(tags, /^(alcohol|beverages)$/),
  },
  {
    id: "others",
    label: "その他",
    color: "#9ca3af",
    clauses: [],
    test: () => false,
  },
];

export const CATEGORIES = categories;
