/**
 * 食べ歩きヒートマップ - スタティック Web サイト用 main.js
 * 
 * このファイルは静的 Web サイトとして動作するように設計されています。
 * Node.js や npm build ツールを使わず、ブラウザだけで動作します。
 */

// ============================================
// === DOM リファレンス取得 ===
// ============================================

const dom = {
  map: document.getElementById("map"),
  fab: document.getElementById("btn-gen"),
  heatCB: document.getElementById("cb-heat"),
  labelsCB: document.getElementById("cb-labels"),
  pointsCB: document.getElementById("cb-points"),
  gridSize: document.getElementById("grid-size"),
  gridOut: document.getElementById("grid-out"),
  legend: document.getElementById("legend"),
  filterInput: document.getElementById("filter-input"),
  btnSave: document.getElementById("btn-save"),
  btnLoad: document.getElementById("btn-load"),
  btnHistory: document.getElementById("btn-history"),
  fileInput: document.getElementById("file-input"),
  useLoaded: document.getElementById("use-loaded"),
  loadedInfo: document.getElementById("loaded-info"),
  loadedBadge: document.getElementById("loaded-badge"),
  historyList: document.getElementById("history-list"),
  historyEmpty: document.getElementById("history-empty"),
  toast: document.getElementById("toast"),
};

// ============================================
// === アプリケーション状態 ===
// ============================================

const state = {
  features: [],
  lastExport: null,
};

// ============================================
// === カテゴリデータ（簡易版：JSON ファイルから読み込み）===
// ============================================

async function loadCategoriesFromFile() {
  const response = await fetch("./src/config/categories.json");
  if (!response.ok) throw new Error("カテゴリ JSON の読み込みに失敗しました。");
  return response.json();
}

const CATEGORIES = [
  { id: "curry", label: "カレー", color: "#d97706", clauses: ["amenity=restaurant"] },
  { id: "ramen", label: "ラーメン", color: "#e11d48", clauses: ["amenity=restaurant"] },
  { id: "sushi", label: "寿司", color: "#0ea5e9", clauses: ["amenity=restaurant"] },
  { id: "cafe", label: "カフェ", color: "#8b5cf6", clauses: ["amenity=cafe"] },
  { id: "bakery", label: "ベーカリー", color: "#a16207", clauses: ["shop=bakery"] },
];

// ============================================
// === DOM 要素の操作 ===
// ============================================

function renderCategoryLegend({ legendEl, categories }) {
  legendEl.innerHTML = "";
  categories.forEach((category) => {
    const row = document.createElement("div");
    row.className = "cat-line";
    row.dataset.cat = category.id;
    row.innerHTML = `
      <input type="checkbox" id="chk-${category.id}" checked />
      <div class="row">
        <span class="dot" style="background:${category.color}"></span>
        <span>${category.label}</span>
      </div>
      <div class="slider-row">
        <span class="sub">0</span>
        <input type="range" id="wt-${category.id}" min="0" max="1" step="0.1" value="0.7" />
        <output class="sub">0.7</output>
      </div>
    `;

    const slider = row.querySelector(`#wt-${category.id}`);
    const output = row.querySelector("output");
    slider.addEventListener("input", () => {
      output.textContent = Number(slider.value).toFixed(1);
    });

    legendEl.appendChild(row);
  });
}

function getSelectedCategories(categories) {
  return categories.filter((category) => document.getElementById(`chk-${category.id}`).checked);
}

function getCategoryWeights(categories) {
  return Object.fromEntries(
    categories.map((category) => {
      const value = parseFloat(document.getElementById(`wt-${category.id}`).value || "0");
      return [category.id, Math.max(0, Math.min(1, value))];
    }),
  );
}

function setAllCategorySelection(categories, checked) {
  categories.forEach((category) => {
    const input = document.getElementById(`chk-${category.id}`);
    if (input) {
      input.checked = checked;
    }
  });
}

function filterCategoryControls({ legendEl, categories, query }) {
  const normalizedQuery = query.trim().toLowerCase();
  [...legendEl.children].forEach((row) => {
    const category = categories.find((item) => item.id === row.dataset.cat);
    const text = `${category?.label || ""} ${category?.id || ""}`.toLowerCase();
    row.style.display = text.includes(normalizedQuery) ? "" : "none";
  });
}

// ============================================
// === Toast コントローラー ===
// ============================================

function createToastController(toastEl) {
  return function showToast(message, type = "info") {
    toastEl.textContent = message;
    toastEl.className = `toast toast-${type}`;
  };
}

// ============================================
// === ヒストリコントローラー ===
// ============================================

const historyItems = [];

function createHistoryController({ openButton, backdrop, closeButton, clearButton, listEl, emptyEl, onRestore }) {
  return {
    save: function(data) {
      const snapshot = JSON.stringify({ features: data.features });
      const index = historyItems.length;
      historyItems.push(snapshot);
      localStorage.setItem("cafemap_history", JSON.stringify(historyItems));
      
      // UI 更新
      clearHistoryUI();
      renderHistoryUI();
    },

    restore: function(index) {
      if (index < 0 || index >= historyItems.length) return false;
      
      const snapshot = historyItems[index];
      onRestore(snapshot);
      localStorage.setItem("cafemap_history_index", JSON.stringify([index]));
      showToast(`履歴（${historyItems.length - index} 点前）を復元しました。`);
      return true;
    },

    clear: function() {
      historyItems.length = 0;
      localStorage.removeItem("cafemap_history");
      renderHistoryUI();
      showToast("保存履歴をクリアしました。");
    },
  };
}

function clearHistoryUI() {
  dom.historyList.innerHTML = "";
  dom.historyEmpty.hidden = false;
}

function renderHistoryUI() {
  if (historyItems.length === 0) {
    dom.historyEmpty.hidden = true;
  } else {
    historyItems.forEach((snapshot, index) => {
      const item = document.createElement("div");
      item.className = "history-item";
      item.innerHTML = `
        <button class="btn btn-small">復元 ${index + 1}</button>
      `;
      
      item.querySelector("button").addEventListener("click", () => {
        dom.fab.classList.add("loading");
        dom.fab.disabled = true;
        
        const snapshot = JSON.parse(snapshot);
        onRestore(snapshot);
        
        dom.fab.classList.remove("loading");
        dom.fab.disabled = false;
      });
      
      dom.historyList.appendChild(item);
    });
    
    dom.historyEmpty.hidden = true;
  }
}

// ============================================
// === ヒストリの取得・保存 ===
// ============================================

async function loadHistoryFromStorage() {
  try {
    const data = localStorage.getItem("cafemap_history");
    if (data) {
      historyItems.push(data);
    }
  } catch (error) {
    console.warn("ローカルストレージからの履歴読み込みに失敗:", error);
  }

  renderHistoryUI();
}

function saveCurrentStateToHistory() {
  const snapshot = JSON.stringify({ features: state.features });
  historyItems.push(snapshot);
  localStorage.setItem("cafemap_history", JSON.stringify(historyItems));
  renderHistoryUI();
}

// ============================================
// === 位置情報機能 ===
// ============================================

function bindLocateButton({ buttonEl, map }) {
  buttonEl.addEventListener("click", async () => {
    if (!navigator.geolocation) {
      showToast("このブラウザは位置情報を取得できません。", "error");
      return;
    }

    navigator.geolocation.watchPosition(
      (position) => {
        const center = [position.coords.longitude, position.coords.latitude];
        map.setView(center);
        showToast("現在地へ移動しました。");
      },
      () => {
        showToast("位置情報の取得に失敗しました。", "error");
      }
    );
  });
}

// ============================================
// === ヒートマップレンダリング（簡易版）===
// ============================================

async function createBaseMap(containerId) {
  // Leaflet から読み込み（CDN を直接呼び出す）
  await loadLibraries();

  return new L.Map(containerId, {
    center: [35.681236, 139.767004], // 東京中心
    zoom: 12,
    layers: [],
  });
}

async function loadLibraries() {
  return new Promise((resolve) => {
    const script = document.createElement("script");
    script.src = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";
    script.onload = () => resolve();
    document.head.appendChild(script);
  });
}

function applyLoadedDataset(dataset) {
  state.features = dataset.features;
  dom.loadedInfo.textContent = `${dataset.features.length} 点`;
  dom.loadedBadge.textContent = "読込済み";
  dom.loadedBadge.classList.add("ok");
  dom.loadedBadge.classList.remove("warn");
}

function clearLoadedDataset() {
  state.features = [];
  dom.loadedInfo.textContent = "—";
  dom.loadedBadge.textContent = "未読込";
  dom.loadedBadge.classList.remove("ok");
  dom.loadedBadge.classList.add("warn");
}

// ============================================
// === ヒートマップ生成（Overpass API）===
// ============================================

async function renderHeatmap({ map, selectedCategories, weights }) {
  const result = await generate(sourceData.allFeatures);
  return result;
}

async function generate(sourceData) {
  try {
    // Overpass API から飲食店データを取得
    const query = buildOverpassQuery(selectedCategories);
    
    const response = await fetch("https://overpass.api.openstreetmap.de/api/quick.php?" + encodeURIComponent(query));
    if (!response.ok) throw new Error(`Overpass API エラー: ${response.status}`);
    
    const data = await response.json();
    return processFeatureData(sourceData, data.elements);
  } catch (error) {
    console.error(error);
    showToast(error.message || "ヒートマップの生成に失敗しました。", "error");
  }
}

function buildOverpassQuery(selectedCategories) {
  // Overpass API クエリを構築（カテゴリに応じて）
  const parts = [];
  selectedCategories.forEach((cat) => {
    if (cat.id === "curry") {
      parts.push('["amenity"~"^restaurant|^fast_food"]');
    } else if (cat.id === "cafe") {
      parts.push('"amenity"="cafe"');
    } else {
      parts.push(`"${cat.id}"`);
    }
  });

  const query = parts.join(", ");
  return `["out:rect(${[35.6812,139.7670]},(${35.67,-139.78}))(${query})" tags:name,area];out;>-(way,node);out skel qt;`;
}

function processFeatureData(sourceData, overpassElements) {
  // 簡易的な処理例
  state.features = [];
  return {
    lastExport: {
      features: sourceData.features,
    },
  };
}

// ============================================
// === イベントハンドラ ===
// ============================================

dom.filterInput.addEventListener("input", (event) => {
  filterCategoryControls({
    legendEl: dom.legend,
    categories: CATEGORIES,
    query: event.target.value || "",
  });
});

dom.gridSize.addEventListener("input", () => {
  dom.gridOut.textContent = `${Number(dom.gridSize.value).toFixed(1)} km`;
});

// ============================================
// === ヒートマップ表示切替 ===
// ============================================

function syncHeatVisibility() {
  console.log("ヒートマップ表示切り替え");
}

function syncPointVisibility() {
  console.log("ポイント表示切り替え");
}

// ============================================
// === メニューパネルの表示制御 ===
// ============================================

dom.menuBtn.addEventListener("click", () => {
  dom.panel.classList.toggle("hidden");
  try {
    localStorage.setItem("panel-hidden", dom.panel.classList.contains("hidden") ? "1" : "0");
  } catch {
    return;
  }
});

// ============================================
// === ヒートマップ生成 ===
// ============================================

async function handleGenerate() {
  const selectedCategories = getSelectedCategories(CATEGORIES);
  if (selectedCategories.length === 0) {
    showToast("少なくとも 1 つ選択してください。", "error");
    return;
  }

  dom.fab.classList.add("loading");
  dom.fab.disabled = true;

  try {
    const result = await renderHeatmap({
      map: dom.map,
      selectedCategories,
      weights: getCategoryWeights(selectedCategories),
    });

    state.lastExport = result.lastExport;
    
    // 生成完了後の処理
    showToast("ヒートマップが生成されました。");
  } catch (error) {
    console.error(error);
    showToast(error.message || "ヒートマップの生成に失敗しました。", "error");
  } finally {
    dom.fab.classList.remove("loading");
    dom.fab.disabled = false;
  }
}

// ============================================
// === GeoJSON 保存・読み込み ===
// ============================================

dom.btnSave.addEventListener("click", () => {
  if (!state.lastExport) {
    showToast("保存できるデータがありません。先に「生成」を実行してください。", "error");
    return;
  }

  try {
    // GeoJSON をブラウザのダウンロード用として出力
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(state.lastExport));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", "cafemap_geojson.json");
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();

    // 履歴に保存
    saveCurrentStateToHistory();

    showToast("GeoJSON を保存しました。");
  } catch (error) {
    showToast(error.message || "保存に失敗しました。", "error");
  }
});

dom.btnLoad.addEventListener("click", () => {
  dom.fileInput.click();
});

dom.fileInput.addEventListener("change", async (event) => {
  const file = event.target.files?.[0];
  event.target.value = "";
  if (!file) {
    return;
  }

  try {
    const text = await readFile(file);
    const dataset = parseJSON(text);
    applyLoadedDataset(dataset);
    dom.useLoaded.checked = true;
    showToast("データを読み込みました。");
  } catch (error) {
    clearLoadedDataset();
    showToast(`読み込み失敗: ${error.message}`, "error");
  }
});

async function readFile(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(reader.error);
    reader.readAsText(file);
  });
}

function parseJSON(text) {
  try {
    return JSON.parse(text);
  } catch (e) {
    throw new Error("無効な GeoJSON フォーマットです。");
  }
}

// ============================================
// === ローカルストレージの管理 ===
// ============================================

restorePanelState();

async function loadCategories() {
  try {
    CATEGORIES = await loadCategoriesFromFile();
  } catch (error) {
    console.error("カテゴリ読み込みに失敗:", error);
  }
}

function restorePanelState() {
  try {
    const hidden = localStorage.getItem("panel-hidden");
    if (hidden === "1") {
      dom.panel.classList.add("hidden");
    }
  } catch {
    return;
  }
}

loadCategories();