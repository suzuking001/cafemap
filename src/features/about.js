export function setupAboutModal({ openButton, backdrop, closeButton }) {
  if (!openButton || !backdrop || !closeButton) {
    return;
  }

  const open = () => {
    backdrop.hidden = false;
  };

  const close = () => {
    backdrop.hidden = true;
  };

  openButton.addEventListener("click", open);
  closeButton.addEventListener("click", close);
  backdrop.addEventListener("click", (event) => {
    if (event.target === backdrop) {
      close();
    }
  });

  window.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && !backdrop.hidden) {
      close();
    }
  });
}
