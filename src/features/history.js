const STORAGE_KEY = "cafemap_history";
const HISTORY_LIMIT = 10;

function readHistory() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (error) {
    console.warn("localStorage read error:", error);
    return [];
  }
}

function writeHistory(items) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    return true;
  } catch (error) {
    console.warn("localStorage write error:", error);
    return false;
  }
}

function formatDateTime(value) {
  const date = new Date(value);
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  return `${month}/${day} ${hours}:${minutes}`;
}

function makeItemLabel(snapshot) {
  const createdAt = snapshot?.meta?.created;
  if (!createdAt) {
    return "保存データ";
  }

  const createdDate = new Date(createdAt);
  const year = createdDate.getFullYear();
  const month = createdDate.getMonth() + 1;
  const day = createdDate.getDate();
  const hours = String(createdDate.getHours()).padStart(2, "0");
  const minutes = String(createdDate.getMinutes()).padStart(2, "0");
  return `${year}/${month}/${day} ${hours}:${minutes}`;
}

export function createHistoryController({
  openButton,
  backdrop,
  closeButton,
  clearButton,
  listEl,
  emptyEl,
  onRestore,
  showToast,
}) {
  const close = () => {
    backdrop.hidden = true;
  };

  const render = () => {
    const history = readHistory();
    listEl.innerHTML = "";
    emptyEl.hidden = history.length > 0;

    if (history.length === 0) {
      return;
    }

    listEl.innerHTML = history
      .map(
        (item, index) => `
          <div class="history-item">
            <div class="history-text">
              <div class="history-title">${item.label || "保存データ"}</div>
              <div class="history-date sub">${formatDateTime(item.timestamp)}</div>
            </div>
            <button class="btn ghost" data-history-index="${index}">復元</button>
          </div>
        `,
      )
      .join("");
  };

  const open = () => {
    render();
    backdrop.hidden = false;
  };

  openButton.addEventListener("click", open);
  closeButton.addEventListener("click", close);
  backdrop.addEventListener("click", (event) => {
    if (event.target === backdrop) {
      close();
    }
  });

  listEl.addEventListener("click", (event) => {
    const button = event.target.closest("[data-history-index]");
    if (!button) {
      return;
    }

    const history = readHistory();
    const index = Number(button.dataset.historyIndex);
    const item = history[index];
    if (!item) {
      showToast("履歴データが見つかりませんでした。", "error");
      return;
    }

    try {
      onRestore(item.data);
      close();
      showToast(`履歴から ${formatDateTime(item.timestamp)} のデータを復元しました。`);
    } catch (error) {
      showToast(`履歴の復元に失敗しました: ${error.message}`, "error");
    }
  });

  clearButton.addEventListener("click", () => {
    if (!confirm("すべての履歴を消去しますか？この操作は元に戻せません。")) {
      return;
    }

    try {
      localStorage.removeItem(STORAGE_KEY);
      render();
      showToast("履歴を消去しました。");
    } catch (error) {
      console.warn("localStorage remove error:", error);
      showToast("履歴の消去に失敗しました。", "error");
    }
  });

  window.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && !backdrop.hidden) {
      close();
    }
  });

  render();

  return {
    save(snapshot) {
      const history = readHistory();
      const items = [
        {
          data: snapshot,
          timestamp: new Date().toISOString(),
          label: makeItemLabel(snapshot),
        },
        ...history,
      ].slice(0, HISTORY_LIMIT);

      if (!writeHistory(items)) {
        throw new Error("履歴を保存できませんでした");
      }

      render();
    },
    refresh: render,
  };
}
