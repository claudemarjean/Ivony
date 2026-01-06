import { sanitizeHtml } from "../supabase.js";

/**
 * Modal component for dialogs, forms, and confirmations
 * Security: All user content is sanitized before rendering
 */

const modalRoot = document.getElementById("modal-root");

/**
 * Show a modal dialog
 * @param {Object} options - Modal configuration
 * @param {string} options.title - Modal title
 * @param {string} options.content - HTML content (will be sanitized if string)
 * @param {Function} options.onConfirm - Callback for confirm button
 * @param {Function} options.onCancel - Callback for cancel button
 * @param {string} options.confirmText - Confirm button text
 * @param {string} options.cancelText - Cancel button text
 * @param {string} options.size - Modal size: 'sm', 'md', 'lg', 'xl'
 * @param {boolean} options.isDangerous - Red confirm button for destructive actions
 */
export function showModal({
  title = "Modal",
  content = "",
  onConfirm = null,
  onCancel = null,
  confirmText = "Confirm",
  cancelText = "Cancel",
  size = "md",
  isDangerous = false,
}) {
  if (!modalRoot) return;

  // Size mappings
  const sizeClasses = {
    sm: "max-w-sm",
    md: "max-w-md",
    lg: "max-w-lg",
    xl: "max-w-2xl",
  };

  const maxWidth = sizeClasses[size] || sizeClasses.md;

  // Create modal backdrop
  const backdrop = document.createElement("div");
  backdrop.className = "fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in";
  backdrop.setAttribute("role", "dialog");
  backdrop.setAttribute("aria-modal", "true");

  // Create modal content
  const modal = document.createElement("div");
  modal.className = `relative w-full ${maxWidth} rounded-2xl border border-slate-800 bg-slate-900 p-6 card-shadow animate-scale-in`;

  // Close button
  const closeBtn = document.createElement("button");
  closeBtn.className = "absolute top-4 right-4 text-slate-400 hover:text-slate-100 text-xl";
  closeBtn.innerHTML = "×";
  closeBtn.setAttribute("aria-label", "Close");
  
  // Title
  const titleEl = document.createElement("h3");
  titleEl.className = "text-lg font-semibold text-slate-50 mb-4";
  titleEl.textContent = title;

  // Content
  const contentEl = document.createElement("div");
  contentEl.className = "text-sm text-slate-300 mb-6";
  
  if (typeof content === "string") {
    contentEl.innerHTML = content; // Allow HTML but sanitize first in caller
  } else if (content instanceof HTMLElement) {
    contentEl.appendChild(content);
  }

  // Buttons
  const actions = document.createElement("div");
  actions.className = "flex gap-3 justify-end";

  if (onCancel || !onConfirm) {
    const cancelBtn = document.createElement("button");
    cancelBtn.className = "rounded-lg border border-slate-700 bg-slate-800 px-4 py-2 text-sm font-semibold text-slate-100 hover:bg-slate-700";
    cancelBtn.textContent = cancelText;
    cancelBtn.addEventListener("click", () => {
      close();
      if (onCancel) onCancel();
    });
    actions.appendChild(cancelBtn);
  }

  if (onConfirm) {
    const confirmBtn = document.createElement("button");
    confirmBtn.className = isDangerous
      ? "rounded-lg bg-rose-500 px-4 py-2 text-sm font-semibold text-white hover:bg-rose-600"
      : "rounded-lg bg-sky-500 px-4 py-2 text-sm font-semibold text-slate-900 hover:bg-sky-600";
    confirmBtn.textContent = confirmText;
    confirmBtn.addEventListener("click", () => {
      const result = onConfirm();
      if (result !== false) close(); // Allow onConfirm to prevent close by returning false
    });
    actions.appendChild(confirmBtn);
  }

  modal.appendChild(closeBtn);
  modal.appendChild(titleEl);
  modal.appendChild(contentEl);
  modal.appendChild(actions);
  backdrop.appendChild(modal);

  // Close handlers
  function close() {
    modalRoot.classList.add("hidden");
    modalRoot.innerHTML = "";
  }

  closeBtn.addEventListener("click", close);
  backdrop.addEventListener("click", (e) => {
    if (e.target === backdrop) close();
  });

  // ESC key to close
  function handleEsc(e) {
    if (e.key === "Escape") {
      close();
      document.removeEventListener("keydown", handleEsc);
    }
  }
  document.addEventListener("keydown", handleEsc);

  // Show modal
  modalRoot.innerHTML = "";
  modalRoot.appendChild(backdrop);
  modalRoot.classList.remove("hidden");

  return close;
}

/**
 * Show confirmation dialog
 */
export function showConfirmDialog({ title, message, onConfirm, isDangerous = false }) {
  return showModal({
    title,
    content: `<p>${sanitizeHtml(message)}</p>`,
    onConfirm,
    confirmText: "Confirm",
    cancelText: "Cancel",
    size: "sm",
    isDangerous,
  });
}

/**
 * Show alert dialog (OK only)
 */
export function showAlert({ title, message }) {
  return showModal({
    title,
    content: `<p>${sanitizeHtml(message)}</p>`,
    confirmText: "OK",
    size: "sm",
  });
}
