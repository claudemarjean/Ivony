import { initLayout, updateUserBadge } from "./components/layout.js";
import { showToast } from "./components/toast.js";
import { restoreSession, onAuthStateChange, logout } from "./auth.js";
import { initRouter, navigateTo } from "./router.js";

async function bootstrap() {
  initLayout();
  bindLogout();

  await restoreSession();
  updateUserBadge();
  initRouter();

  onAuthStateChange(() => {
    updateUserBadge();
    navigateTo(window.location.hash.slice(1) || "/");
  });
}

function bindLogout() {
  const btn = document.getElementById("logout-btn");
  if (!btn) return;
  btn.addEventListener("click", async () => {
    await logout();
    showToast({ title: "Signed out", description: "Session cleared", variant: "info" });
    navigateTo("/login");
  });
}

document.addEventListener("DOMContentLoaded", bootstrap);
