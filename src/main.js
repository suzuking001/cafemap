import { CATEGORIES } from "./config/categories.js";
import { getInterpretationMessage } from "./config/interpretations.js";
import { getDomRefs } from "./core/dom.js";
import { createAppState } from "./core/state.js";
import { downloadGeoJSON, normalizeFeatureCollection, readGeoJSONFile } from "./data/geojson.js";
import { setupAboutModal } from "./features/about.js";
import { createHistoryController } from "./features/history.js";
import { bindLocateButton } from "./features/location.js";
import { createBaseMap, syncHeatLayerVisibility, syncPointLayerVisibility } from "./map/baseMap.js";
import { renderHeatmap } from "./map/heatmap.js";
import {
  filterCategoryControls,
  getCategoryWeights,
  getSelectedCategories,
  renderCategoryLegend,
  setAllCategorySelection,
} from "./ui/categories.js";
import { createToastController } from "./ui/toast.js";

const dom = getDomRefs();
const showToast = createToastController(dom.toast);

renderCategoryLegend({ legendEl: dom.legend, categories: CATEGORIES });

const map = createBaseMap("map");
const state = createAppState(map);

setupAboutModal({
  openButton: dom.btnAbout,
  backdrop: dom.aboutBackdrop,
  closeButton: dom.aboutClose,
});

bindLocateButton({
  buttonEl: dom.locateBtn,
  map,
  state,
  showToast,
});

const historyController = createHistoryController({
  openButton: dom.btnHistory,
  backdrop: dom.historyBackdrop,
  closeButton: dom.historyClose,
  clearButton: dom.btnHistoryClear,
  listEl: dom.historyList,
  emptyEl: dom.historyEmpty,
  onRestore: restoreHistorySnapshot,
  showToast,
});

dom.btnAll.addEventListener("click", () => {
  setAllCategorySelection(CATEGORIES, true);
});

dom.btnNone.addEventListener("click", () => {
  setAllCategorySelection(CATEGORIES, false);
});

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

dom.heatCB.addEventListener("change", syncHeatVisibility);
dom.labelsCB.addEventListener("change", syncHeatVisibility);
dom.pointsCB.addEventListener("change", syncPointVisibility);

dom.menuBtn.addEventListener("click", () => {
  dom.panel.classList.toggle("hidden");
  try {
    localStorage.setItem("panel-hidden", dom.panel.classList.contains("hidden") ? "1" : "0");
  } catch {
    return;
  }
});

dom.fab.addEventListener("click", handleGenerate);

dom.btnSave.addEventListener("click", () => {
  if (!state.lastExport) {
    showToast("保存できるデータがありません。先に「生成」を実行してください。", "error");
    return;
  }

  try {
    downloadGeoJSON(state.lastExport);
    historyController.save(state.lastExport);
    showToast("GeoJSONを保存しました。");
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
    const dataset = await readGeoJSONFile(file);
    applyLoadedDataset(dataset);
    dom.useLoaded.checked = true;
    showToast("データを読み込みました。");
  } catch (error) {
    clearLoadedDataset();
    showToast(`読み込み失敗: ${error.message}`, "error");
  }
});

restorePanelState();
dom.gridOut.textContent = `${Number(dom.gridSize.value).toFixed(1)} km`;

function restoreHistorySnapshot(snapshot) {
  const dataset = normalizeFeatureCollection(snapshot);
  applyLoadedDataset(dataset);
  dom.useLoaded.checked = true;
}

function applyLoadedDataset(dataset) {
  state.loadedDataset = dataset;
  state.lastExport = dataset;
  dom.loadedInfo.textContent = `${dataset.features.length} 点`;
  dom.loadedBadge.textContent = "読込済み";
  dom.loadedBadge.classList.add("ok");
  dom.loadedBadge.classList.remove("warn");
}

function clearLoadedDataset() {
  state.loadedDataset = null;
  dom.useLoaded.checked = false;
  dom.loadedInfo.textContent = "—";
  dom.loadedBadge.textContent = "未読込";
  dom.loadedBadge.classList.remove("ok");
  dom.loadedBadge.classList.add("warn");
}

function restorePanelState() {
  try {
    if (localStorage.getItem("panel-hidden") === "1") {
      dom.panel.classList.add("hidden");
    }
  } catch {
    return;
  }
}

function syncHeatVisibility() {
  syncHeatLayerVisibility({
    map,
    state,
    showHeat: dom.heatCB.checked,
    showLabels: dom.labelsCB.checked,
  });
}

function syncPointVisibility() {
  syncPointLayerVisibility({
    map,
    state,
    visible: dom.pointsCB.checked,
  });
}

async function handleGenerate() {
  const selectedCategories = getSelectedCategories(CATEGORIES);
  if (selectedCategories.length === 0) {
    showToast("少なくとも1つ選択してください。", "error");
    return;
  }

  dom.fab.classList.add("loading");
  dom.fab.disabled = true;

  try {
    const result = await renderHeatmap({
      map,
      state,
      selectedCategories,
      weights: getCategoryWeights(selectedCategories),
      gridSizeKm: parseFloat(dom.gridSize.value) || 0.4,
      loadedDataset: state.loadedDataset,
      useLoaded: Boolean(dom.useLoaded.checked && state.loadedDataset),
      pointsVisible: dom.pointsCB.checked,
    });

    state.lastExport = result.lastExport;
    syncHeatVisibility();
    syncPointVisibility();
    showToast(getInterpretationMessage(result.topCategory));
  } catch (error) {
    console.error(error);
    showToast(error.message || "ヒートマップの生成に失敗しました。", "error");
  } finally {
    dom.fab.classList.remove("loading");
    dom.fab.disabled = false;
  }
}
