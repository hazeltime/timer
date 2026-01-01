export class ModalManager {
  /**
   * @param {Object} dom - The DOM object containing modal references
   */
  constructor(dom) {
    this.dom = dom;
    this.activeModal = null;
    this.focusTrap = null;
    this._setupGlobalListeners();
  }

  _setupGlobalListeners() {
    // Close on backdrop click (standardized)
    document.addEventListener("click", (e) => {
      if (e.target.classList.contains("modal-overlay")) {
        this.closeAll();
      }
    });

    // Close on Escape key
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && this.activeModal) {
        this.closeAll();
      }
    });

    // Delegate close buttons
    document.addEventListener("click", (e) => {
      if (
        e.target.closest(".modal-close-btn") ||
        e.target.closest(".close-modal")
      ) {
        this.closeAll();
      }
    });
  }

  /**
   * Opens the confirmation modal
   * @param {string} title
   * @param {string} text
   * @param {Function} onConfirm
   */
  openConfirm(title, text, onConfirm) {
    const {
      confirmModal,
      modalTitle,
      modalText,
      modalConfirmBtn,
      modalCancelBtn,
    } = this.dom.modalDOM;

    modalTitle.textContent = title;
    modalText.textContent = text;

    // Clean up old listeners to prevent stacking
    const newConfirm = modalConfirmBtn.cloneNode(true);
    modalConfirmBtn.parentNode.replaceChild(newConfirm, modalConfirmBtn);
    this.dom.modalDOM.modalConfirmBtn = newConfirm;

    const newCancel = modalCancelBtn.cloneNode(true);
    modalCancelBtn.parentNode.replaceChild(newCancel, modalCancelBtn);
    this.dom.modalDOM.modalCancelBtn = newCancel;

    newConfirm.addEventListener("click", () => {
      onConfirm();
      this.closeAll();
    });

    newCancel.addEventListener("click", () => {
      this.closeAll();
    });

    this._show(confirmModal);
    // Focus confirm by default for destructive? Or cancel? Let's focus cancel for safety, or confirm for speed.
    // Standard UX: Focus the least destructive, or the primary if safe.
    // Let's focus Cancel.
    newCancel.focus();
  }

  openGuide() {
    this._show(this.dom.guideModalDOM.guideModal);
  }

  /**
   * Internal show method
   * @param {HTMLElement} modalEl
   */
  _show(modalEl) {
    this.closeAll(); // Close others first
    modalEl.style.display = "flex";
    // Force reflow for transition? (If we had CSS transitions on display:flex, which we don't usually)
    // But we might have opacity.
    requestAnimationFrame(() => {
      modalEl.classList.add("open");
    });
    this.activeModal = modalEl;
    document.body.style.overflow = "hidden"; // Prevent background scroll
  }

  closeAll() {
    if (!this.activeModal) return;

    const el = this.activeModal;
    el.classList.remove("open");
    // Wait for transition? Or just hide.
    // For simplicity, hide immediately or use existing CSS logic.
    // The existing CSS likely uses display: none.
    el.style.display = "none";

    this.activeModal = null;
    document.body.style.overflow = "";
  }
}
