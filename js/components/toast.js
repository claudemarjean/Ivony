const TOAST_DURATION = 4200;
const toastRoot = document.getElementById("toast-root");

export function showToast({ title, description = "", variant = "info" }) {
  if (!toastRoot) return;
  const wrapper = document.createElement("div");
  wrapper.className = `pointer-events-auto w-full max-w-sm overflow-hidden rounded-xl border border-slate-800 bg-slate-900/90 card-shadow shadow-lg text-slate-100 animate-fade-in`;

  const color = variant === "success" ? "text-emerald-300" : variant === "error" ? "text-rose-300" : variant === "warning" ? "text-amber-300" : "text-sky-300";

  wrapper.innerHTML = `
    <div class="flex items-start gap-3 p-4">
      <div class="mt-0.5 h-2 w-2 rounded-full bg-slate-500"></div>
      <div class="flex-1">
        <p class="text-sm font-semibold ${color}">${escapeHtml(title)}</p>
        ${description ? `<p class="mt-1 text-xs text-slate-300">${escapeHtml(description)}</p>` : ""}
      </div>
      <button class="text-slate-400 hover:text-slate-100 text-sm" aria-label="Dismiss">✕</button>
    </div>
  `;

  const dismissBtn = wrapper.querySelector("button");
  dismissBtn.addEventListener("click", () => toastRoot.removeChild(wrapper));

  toastRoot.appendChild(wrapper);
  setTimeout(() => {
    if (toastRoot.contains(wrapper)) toastRoot.removeChild(wrapper);
  }, TOAST_DURATION);
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
