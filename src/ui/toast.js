export function createToastController(toastEl) {
  let timerId = null;

  return (message, type = "") => {
    toastEl.textContent = message;
    toastEl.style.display = "block";
    toastEl.style.borderColor = type === "error" ? "var(--danger)" : "var(--border)";

    clearTimeout(timerId);
    timerId = window.setTimeout(() => {
      toastEl.style.display = "none";
    }, 2400);
  };
}
