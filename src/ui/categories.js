function checkboxId(categoryId) {
  return `chk-${categoryId}`;
}

function weightId(categoryId) {
  return `wt-${categoryId}`;
}

export function renderCategoryLegend({ legendEl, categories }) {
  legendEl.innerHTML = "";
  categories.forEach((category) => {
    const row = document.createElement("div");
    row.className = "cat-line";
    row.dataset.cat = category.id;
    row.innerHTML = `
      <input type="checkbox" id="${checkboxId(category.id)}" checked />
      <div class="row">
        <span class="dot" style="background:${category.color}"></span>
        <span>${category.label}</span>
      </div>
      <div class="slider-row">
        <span class="sub">0</span>
        <input type="range" id="${weightId(category.id)}" min="0" max="1" step="0.1" value="0.7" />
        <output class="sub">0.7</output>
      </div>
    `;

    const slider = row.querySelector(`#${weightId(category.id)}`);
    const output = row.querySelector("output");
    slider.addEventListener("input", () => {
      output.textContent = Number(slider.value).toFixed(1);
    });

    legendEl.appendChild(row);
  });
}

export function getSelectedCategories(categories) {
  return categories.filter((category) => document.getElementById(checkboxId(category.id))?.checked);
}

export function getCategoryWeights(categories) {
  return Object.fromEntries(
    categories.map((category) => {
      const value = parseFloat(document.getElementById(weightId(category.id))?.value || "0");
      return [category.id, Math.max(0, Math.min(1, value))];
    }),
  );
}

export function setAllCategorySelection(categories, checked) {
  categories.forEach((category) => {
    const input = document.getElementById(checkboxId(category.id));
    if (input) {
      input.checked = checked;
    }
  });
}

export function filterCategoryControls({ legendEl, categories, query }) {
  const normalizedQuery = query.trim().toLowerCase();
  [...legendEl.children].forEach((row) => {
    const category = categories.find((item) => item.id === row.dataset.cat);
    const text = `${category?.label || ""} ${category?.id || ""}`.toLowerCase();
    row.style.display = text.includes(normalizedQuery) ? "" : "none";
  });
}
