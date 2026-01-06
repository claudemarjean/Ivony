import { showToast } from "../components/toast.js";
import { showModal, showConfirmDialog } from "../components/modal.js";
import { fetchApplications, createApplication, updateApplication, deleteApplication } from "../api.js";
import { sanitizeHtml } from "../supabase.js";
import dayjs from "https://cdn.jsdelivr.net/npm/dayjs@1.11.10/+esm";

let currentApps = [];

/**
 * Applications/Projects management page
 * Features:
 * - CRUD operations for applications
 * - Status management
 * - Search and filter
 * - Modal forms
 * - RLS enforced
 */
export async function renderApplications(container) {
  const wrapper = document.createElement("div");
  wrapper.className = "space-y-6";
  
  // Header
  const header = document.createElement("div");
  header.className = "flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between";
  header.innerHTML = `
    <div>
      <p class="text-xs uppercase tracking-[0.2em] text-slate-500">Application Inventory</p>
      <h2 class="text-2xl font-semibold text-slate-50">Applications</h2>
      <p class="text-sm text-slate-400">Manage apps and Supabase projects • IDOR protected</p>
    </div>
    <div class="flex gap-3">
      <select id="filter-status" class="rounded-lg border border-slate-800 bg-slate-950/60 px-4 py-2 text-sm text-slate-50">
        <option value="">All Status</option>
        <option value="live">Live</option>
        <option value="beta">Beta</option>
        <option value="draft">Draft</option>
      </select>
      <button id="create-app" class="rounded-lg bg-emerald-500 px-4 py-2 text-sm font-semibold text-slate-900 shadow hover:bg-emerald-600">✚ New App</button>
    </div>
  `;
  
  // Apps grid
  const gridContainer = document.createElement("div");
  gridContainer.innerHTML = `
    <div id="loading-state" class="py-12 text-center text-slate-400">
      <div class="inline-block h-8 w-8 animate-spin rounded-full border-4 border-slate-700 border-t-emerald-500"></div>
      <p class="mt-2 text-sm">Loading applications...</p>
    </div>
    <div id="apps-grid" class="hidden grid gap-4 md:grid-cols-2 lg:grid-cols-3"></div>
    <div id="empty-state" class="hidden rounded-2xl border border-slate-800 bg-slate-900/70 p-12 text-center card-shadow">
      <p class="text-slate-400">No applications found</p>
      <button id="create-first-app" class="mt-4 rounded-lg bg-emerald-500 px-4 py-2 text-sm font-semibold text-slate-900">Create Your First App</button>
    </div>
  `;
  
  wrapper.appendChild(header);
  wrapper.appendChild(gridContainer);
  container.appendChild(wrapper);
  
  // Load apps
  await loadApplications();
  
  // Event listeners
  header.querySelector("#create-app").addEventListener("click", showCreateAppModal);
  header.querySelector("#filter-status").addEventListener("change", (e) => loadApplications({ status: e.target.value || undefined }));
  gridContainer.querySelector("#create-first-app")?.addEventListener("click", showCreateAppModal);
}

async function loadApplications(filters = {}) {
  const loadingEl = document.getElementById("loading-state");
  const gridEl = document.getElementById("apps-grid");
  const emptyEl = document.getElementById("empty-state");
  
  loadingEl.classList.remove("hidden");
  gridEl.classList.add("hidden");
  emptyEl.classList.add("hidden");
  
  try {
    const { applications } = await fetchApplications({ limit: 50, ...filters });
    currentApps = applications;
    
    if (applications.length === 0) {
      emptyEl.classList.remove("hidden");
    } else {
      renderAppCards(applications);
      gridEl.classList.remove("hidden");
    }
  } catch (error) {
    showToast({ title: "Error loading apps", description: error.message, variant: "error" });
    emptyEl.classList.remove("hidden");
  } finally {
    loadingEl.classList.add("hidden");
  }
}

function renderAppCards(apps) {
  const grid = document.getElementById("apps-grid");
  grid.innerHTML = "";
  
  apps.forEach((app) => {
    const card = document.createElement("div");
    card.className = "rounded-2xl border border-slate-800 bg-slate-900/70 p-5 card-shadow hover:border-sky-500/50 transition-colors";
    
    const statusColor = app.status === "live" ? "emerald" : app.status === "beta" ? "amber" : "slate";
    
    card.innerHTML = `
      <div class="flex items-start justify-between mb-3">
        <div class="h-12 w-12 rounded-xl bg-gradient-to-br from-emerald-400 to-sky-400 flex items-center justify-center text-lg font-bold text-slate-900">
          ${sanitizeHtml(app.name.charAt(0).toUpperCase())}
        </div>
        <span class="inline-flex items-center rounded-full bg-${statusColor}-500/20 px-2 py-1 text-xs font-medium text-${statusColor}-300 uppercase">
          ${sanitizeHtml(app.status)}
        </span>
      </div>
      <h3 class="text-lg font-semibold text-slate-50 mb-1">${sanitizeHtml(app.name)}</h3>
      <p class="text-sm text-slate-400 mb-1">${sanitizeHtml(app.description || "No description")}</p>
      <p class="text-xs text-slate-500">Owner: ${sanitizeHtml(app.owner || "Unassigned")}</p>
      <p class="text-xs text-slate-500 mt-2">Created ${dayjs(app.created_at).format("MMM D, YYYY")}</p>
      <div class="mt-4 flex gap-2">
        <button class="edit-app-btn flex-1 rounded-lg border border-slate-700 px-3 py-2 text-sm hover:bg-slate-800" data-app-id="${sanitizeHtml(app.id)}">Edit</button>
        <button class="delete-app-btn rounded-lg border border-rose-700 px-3 py-2 text-sm text-rose-300 hover:bg-rose-900/20" data-app-id="${sanitizeHtml(app.id)}" data-app-name="${sanitizeHtml(app.name)}">✕</button>
      </div>
    `;
    
    grid.appendChild(card);
  });
  
  // Event listeners
  grid.querySelectorAll(".edit-app-btn").forEach(btn => {
    btn.addEventListener("click", (e) => {
      const app = currentApps.find(a => a.id === e.target.dataset.appId);
      if (app) showEditAppModal(app);
    });
  });
  
  grid.querySelectorAll(".delete-app-btn").forEach(btn => {
    btn.addEventListener("click", (e) => {
      handleDeleteApp(e.target.dataset.appId, e.target.dataset.appName);
    });
  });
}

function showCreateAppModal() {
  const form = document.createElement("div");
  form.className = "space-y-4";
  form.innerHTML = `
    <div>
      <label class="block text-sm text-slate-300 mb-1">Application Name</label>
      <input id="app-name" type="text" required class="w-full rounded-lg border border-slate-800 bg-slate-950/60 px-3 py-2 text-slate-50" placeholder="My App" />
    </div>
    <div>
      <label class="block text-sm text-slate-300 mb-1">Description</label>
      <textarea id="app-desc" rows="3" class="w-full rounded-lg border border-slate-800 bg-slate-950/60 px-3 py-2 text-slate-50" placeholder="Brief description..."></textarea>
    </div>
    <div>
      <label class="block text-sm text-slate-300 mb-1">Owner</label>
      <input id="app-owner" type="text" class="w-full rounded-lg border border-slate-800 bg-slate-950/60 px-3 py-2 text-slate-50" placeholder="Team or person" />
    </div>
    <div>
      <label class="block text-sm text-slate-300 mb-1">Status</label>
      <select id="app-status" class="w-full rounded-lg border border-slate-800 bg-slate-950/60 px-3 py-2 text-slate-50">
        <option value="draft">Draft</option>
        <option value="beta">Beta</option>
        <option value="live">Live</option>
      </select>
    </div>
  `;
  
  showModal({
    title: "Create Application",
    content: form,
    size: "lg",
    confirmText: "Create",
    onConfirm: async () => {
      const name = form.querySelector("#app-name").value.trim();
      const description = form.querySelector("#app-desc").value.trim();
      const owner = form.querySelector("#app-owner").value.trim();
      const status = form.querySelector("#app-status").value;
      
      if (!name) {
        showToast({ title: "Validation error", description: "Name is required", variant: "error" });
        return false;
      }
      
      try {
        await createApplication({ name, description, owner, status });
        showToast({ title: "Success", description: "Application created", variant: "success" });
        await loadApplications();
      } catch (error) {
        showToast({ title: "Error", description: error.message, variant: "error" });
        return false;
      }
    },
  });
}

function showEditAppModal(app) {
  const form = document.createElement("div");
  form.className = "space-y-4";
  form.innerHTML = `
    <div>
      <label class="block text-sm text-slate-300 mb-1">Application Name</label>
      <input id="app-name" type="text" required class="w-full rounded-lg border border-slate-800 bg-slate-950/60 px-3 py-2 text-slate-50" value="${sanitizeHtml(app.name)}" />
    </div>
    <div>
      <label class="block text-sm text-slate-300 mb-1">Description</label>
      <textarea id="app-desc" rows="3" class="w-full rounded-lg border border-slate-800 bg-slate-950/60 px-3 py-2 text-slate-50">${sanitizeHtml(app.description || "")}</textarea>
    </div>
    <div>
      <label class="block text-sm text-slate-300 mb-1">Owner</label>
      <input id="app-owner" type="text" class="w-full rounded-lg border border-slate-800 bg-slate-950/60 px-3 py-2 text-slate-50" value="${sanitizeHtml(app.owner || "")}" />
    </div>
    <div>
      <label class="block text-sm text-slate-300 mb-1">Status</label>
      <select id="app-status" class="w-full rounded-lg border border-slate-800 bg-slate-950/60 px-3 py-2 text-slate-50">
        <option value="draft" ${app.status === "draft" ? "selected" : ""}>Draft</option>
        <option value="beta" ${app.status === "beta" ? "selected" : ""}>Beta</option>
        <option value="live" ${app.status === "live" ? "selected" : ""}>Live</option>
      </select>
    </div>
  `;
  
  showModal({
    title: "Edit Application",
    content: form,
    size: "lg",
    confirmText: "Update",
    onConfirm: async () => {
      const name = form.querySelector("#app-name").value.trim();
      const description = form.querySelector("#app-desc").value.trim();
      const owner = form.querySelector("#app-owner").value.trim();
      const status = form.querySelector("#app-status").value;
      
      try {
        await updateApplication(app.id, { name, description, owner, status });
        showToast({ title: "Success", description: "Application updated", variant: "success" });
        await loadApplications();
      } catch (error) {
        showToast({ title: "Error", description: error.message, variant: "error" });
        return false;
      }
    },
  });
}

function handleDeleteApp(appId, appName) {
  showConfirmDialog({
    title: "Delete Application",
    message: `Are you sure you want to delete "${appName}"? This action cannot be undone.`,
    isDangerous: true,
    onConfirm: async () => {
      try {
        await deleteApplication(appId);
        showToast({ title: "Deleted", description: "Application removed", variant: "success" });
        await loadApplications();
      } catch (error) {
        showToast({ title: "Error", description: error.message, variant: "error" });
      }
    },
  });
}
