import { navigateTo, currentRoute } from "../router.js";
import { getState } from "../state.js";

const navItems = [
  { path: "/", label: "Dashboard" },
  { path: "/users", label: "Users" },
  { path: "/applications", label: "Applications" },
  { path: "/projects", label: "Supabase Projects" },
  { path: "/analytics", label: "Analytics" },
  { path: "/logs", label: "Logs" },
  { path: "/settings", label: "Settings" },
];

export function initLayout() {
  const root = document.getElementById("app");
  if (!root) return;

  const shell = document.createElement("div");
  shell.className = "flex min-h-screen";

  const sidebar = document.createElement("aside");
  sidebar.className = "hidden lg:flex w-64 flex-col border-r border-slate-800/80 bg-slate-950/80 bg-glass";
  sidebar.innerHTML = `
    <div class="flex items-center gap-2 px-5 py-6 border-b border-slate-800/70">
      <div class="h-10 w-10 rounded-2xl bg-gradient-to-br from-sky-400 to-indigo-500 flex items-center justify-center font-black text-slate-900">IV</div>
      <div>
        <p class="text-sm text-slate-300">Secure Control</p>
        <p class="font-semibold text-slate-50">Ivony Platform</p>
      </div>
    </div>
    <nav class="flex-1 px-3 py-6" aria-label="Main">
      <ul class="space-y-1" id="nav-list"></ul>
    </nav>
    <div class="px-4 py-5 border-t border-slate-800/70 text-xs text-slate-400">RLS enforced • Zero-trust ready</div>
  `;

  const navList = sidebar.querySelector("#nav-list");
  navItems.forEach((item) => {
    const li = document.createElement("li");
    const link = document.createElement("a");
    link.href = `#${item.path}`;
    link.textContent = item.label;
    link.className = "flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-slate-200 hover:bg-slate-800/80 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-400";
    link.addEventListener("click", (e) => {
      e.preventDefault();
      navigateTo(item.path);
    });
    li.appendChild(link);
    navList.appendChild(li);
  });

  const main = document.createElement("div");
  main.className = "flex-1 flex flex-col bg-slate-950/60";
  main.innerHTML = `
    <header class="sticky top-0 z-20 border-b border-slate-800/70 bg-slate-950/80 backdrop-blur">
      <div class="flex items-center justify-between px-4 lg:px-8 py-4">
        <div>
          <p class="text-xs uppercase tracking-[0.2em] text-slate-500">Secure Admin</p>
          <h1 id="page-title" class="text-xl font-semibold text-slate-50">Dashboard</h1>
        </div>
        <div class="flex items-center gap-3">
          <span id="user-email" class="hidden sm:block text-sm text-slate-300"></span>
          <button id="logout-btn" class="rounded-full bg-slate-800 px-4 py-2 text-sm font-semibold text-slate-100 hover:bg-slate-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-400">Logout</button>
        </div>
      </div>
    </header>
    <main id="page-root" class="flex-1 px-4 pb-10 pt-6 lg:px-8"></main>
  `;

  shell.appendChild(sidebar);
  shell.appendChild(main);
  root.innerHTML = "";
  root.appendChild(shell);

  updateUserBadge();
}

export function updateUserBadge() {
  const { user } = getState();
  const badge = document.getElementById("user-email");
  if (badge) badge.textContent = user?.email || "Guest";
}

export function setActiveNav() {
  const route = currentRoute();
  document.querySelectorAll("#nav-list a").forEach((link) => {
    const isActive = link.getAttribute("href") === `#${route}`;
    link.classList.toggle("bg-slate-800", isActive);
    link.classList.toggle("text-sky-200", isActive);
  });
}
