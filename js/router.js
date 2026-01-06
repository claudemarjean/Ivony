import { getState } from "./state.js";
import { navigateToLoginView } from "./pages/login.js";
import { renderDashboard } from "./pages/dashboard.js";
import { renderUsers } from "./pages/users.js";
import { renderApplications } from "./pages/applications.js";
import { renderAnalytics } from "./pages/analytics.js";
import { renderLogs } from "./pages/logs.js";
import { renderSettings } from "./pages/settings.js";
import { setActiveNav } from "./components/layout.js";

let currentCleanup = null;
let pageRoot = null;

const routes = {
  "/": { render: renderDashboard, title: "Dashboard", roles: ["admin", "manager", "viewer"] },
  "/users": { render: renderUsers, title: "Users", roles: ["admin", "manager"] },
  "/applications": { render: renderApplications, title: "Applications", roles: ["admin", "manager"] },
  "/projects": { render: renderApplications, title: "Projects", roles: ["admin", "manager"] },
  "/analytics": { render: renderAnalytics, title: "Analytics", roles: ["admin", "manager", "viewer"] },
  "/logs": { render: renderLogs, title: "Logs", roles: ["admin"] },
  "/settings": { render: renderSettings, title: "Settings", roles: ["admin"] },
};

export function initRouter() {
  pageRoot = document.getElementById("page-root");
  window.addEventListener("hashchange", () => navigate(window.location.hash.slice(1) || "/"));
  navigate(window.location.hash.slice(1) || "/");
}

export function navigateTo(path) {
  if (window.location.hash.slice(1) === path) {
    navigate(path);
  } else {
    window.location.hash = path;
  }
}

export function currentRoute() {
  return window.location.hash.slice(1) || "/";
}

async function navigate(path) {
  if (!pageRoot) return;
  const route = routes[path] || routes["/"];
  const { isAuthenticated, role } = getState();

  if (!isAuthenticated) {
    cleanupCurrent();
    navigateToLoginView(pageRoot);
    document.title = "Login • Ivony";
    return;
  }

  if (!route.roles.includes(role)) {
    cleanupCurrent();
    pageRoot.innerHTML = `<div class="rounded-2xl border border-amber-500/40 bg-amber-500/10 p-6 text-amber-200">You do not have access to ${escapeHtml(route.title)}.</div>`;
    document.title = `${route.title} • Ivony`;
    return;
  }

  cleanupCurrent();
  pageRoot.innerHTML = "";
  const cleanup = await route.render(pageRoot);
  currentCleanup = typeof cleanup === "function" ? cleanup : null;
  document.title = `${route.title} • Ivony`;
  setActiveNav();
}

function cleanupCurrent() {
  if (currentCleanup) {
    currentCleanup();
    currentCleanup = null;
  }
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
