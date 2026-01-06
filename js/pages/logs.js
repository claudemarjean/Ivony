import { fetchAuditLogs } from "../api.js";
import { showToast } from "../components/toast.js";
import { sanitizeHtml } from "../supabase.js";
import dayjs from "https://cdn.jsdelivr.net/npm/dayjs@1.11.10/+esm";
import relativeTime from "https://cdn.jsdelivr.net/npm/dayjs@1.11.10/plugin/relativeTime/+esm";

dayjs.extend(relativeTime);

let currentPage = 1;

/**
 * Audit Logs page (read-only)
 * Features:
 * - Complete audit trail
 * - Filtering by action type
 * - Pagination
 * - Real-time updates
 * - Admin-only access (enforced by RLS)
 */
export async function renderLogs(container) {
  const wrapper = document.createElement("div");
  wrapper.className = "space-y-6";
  
  // Header
  const header = document.createElement("div");
  header.className = "flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between";
  header.innerHTML = `
    <div>
      <p class="text-xs uppercase tracking-[0.2em] text-slate-500">Audit Trail</p>
      <h2 class="text-2xl font-semibold text-slate-50">System Logs</h2>
      <p class="text-sm text-slate-400">Read-only audit trail • All actions logged • Tamper-proof</p>
    </div>
    <div class="flex gap-3">
      <select id="filter-action" class="rounded-lg border border-slate-800 bg-slate-950/60 px-4 py-2 text-sm text-slate-50">
        <option value="">All Actions</option>
        <option value="LOGIN">Login</option>
        <option value="LOGOUT">Logout</option>
        <option value="CREATE">Create</option>
        <option value="UPDATE">Update</option>
        <option value="DELETE">Delete</option>
      </select>
      <button id="refresh-logs" class="rounded-lg border border-slate-800 bg-slate-900 px-4 py-2 text-sm text-slate-100 hover:border-sky-500/60">⟳ Refresh</button>
    </div>
  `;
  
  // Logs table
  const logsCard = document.createElement("div");
  logsCard.className = "rounded-2xl border border-slate-800 bg-slate-900/70 p-5 card-shadow";
  logsCard.innerHTML = `
    <div id="loading-state" class="py-8 text-center text-slate-400">
      <div class="inline-block h-8 w-8 animate-spin rounded-full border-4 border-slate-700 border-t-sky-500"></div>
      <p class="mt-2 text-sm">Loading logs...</p>
    </div>
    <div id="logs-content" class="hidden">
      <div class="overflow-x-auto">
        <table class="min-w-full text-left text-sm text-slate-200">
          <thead class="border-b border-slate-800 text-xs uppercase tracking-wide text-slate-400">
            <tr>
              <th class="px-4 py-3">Timestamp</th>
              <th class="px-4 py-3">Action</th>
              <th class="px-4 py-3">Actor</th>
              <th class="px-4 py-3">Details</th>
            </tr>
          </thead>
          <tbody id="log-rows" class="divide-y divide-slate-800/80"></tbody>
        </table>
      </div>
      <div id="pagination" class="mt-4 flex items-center justify-between text-sm text-slate-400">
        <span id="page-info"></span>
        <div class="flex gap-2">
          <button id="prev-page" class="rounded-lg border border-slate-800 px-3 py-1 hover:bg-slate-800 disabled:opacity-50">Previous</button>
          <button id="next-page" class="rounded-lg border border-slate-800 px-3 py-1 hover:bg-slate-800 disabled:opacity-50">Next</button>
        </div>
      </div>
    </div>
    <div id="empty-state" class="hidden py-8 text-center text-slate-400">
      <p>No logs found</p>
    </div>
  `;
  
  wrapper.appendChild(header);
  wrapper.appendChild(logsCard);
  container.appendChild(wrapper);
  
  // Load logs
  await loadLogs();
  
  // Event listeners
  header.querySelector("#filter-action").addEventListener("change", (e) => {
    loadLogs(1, e.target.value || undefined);
  });
  
  header.querySelector("#refresh-logs").addEventListener("click", () => {
    const action = header.querySelector("#filter-action").value || undefined;
    loadLogs(currentPage, action);
    showToast({ title: "Refreshing logs", variant: "info" });
  });
  
  logsCard.querySelector("#prev-page").addEventListener("click", () => {
    const action = header.querySelector("#filter-action").value || undefined;
    loadLogs(currentPage - 1, action);
  });
  
  logsCard.querySelector("#next-page").addEventListener("click", () => {
    const action = header.querySelector("#filter-action").value || undefined;
    loadLogs(currentPage + 1, action);
  });
}

async function loadLogs(page = 1, action = undefined) {
  const loadingEl = document.getElementById("loading-state");
  const contentEl = document.getElementById("logs-content");
  const emptyEl = document.getElementById("empty-state");
  
  loadingEl.classList.remove("hidden");
  contentEl.classList.add("hidden");
  emptyEl.classList.add("hidden");
  
  try {
    const { logs, total, page: currentPageNum, limit } = await fetchAuditLogs({ page, limit: 20, action });
    currentPage = currentPageNum;
    
    if (logs.length === 0) {
      emptyEl.classList.remove("hidden");
    } else {
      renderLogRows(logs);
      updatePagination(currentPageNum, limit, total);
      contentEl.classList.remove("hidden");
    }
  } catch (error) {
    showToast({ title: "Error loading logs", description: error.message, variant: "error" });
    emptyEl.classList.remove("hidden");
  } finally {
    loadingEl.classList.add("hidden");
  }
}

function renderLogRows(logs) {
  const tbody = document.getElementById("log-rows");
  tbody.innerHTML = "";
  
  logs.forEach((log) => {
    const tr = document.createElement("tr");
    tr.className = "hover:bg-slate-800/50";
    
    // Action color coding
    const actionColors = {
      LOGIN: "emerald",
      LOGOUT: "slate",
      CREATE: "sky",
      UPDATE: "amber",
      DELETE: "rose",
    };
    const color = actionColors[log.action] || "slate";
    
    tr.innerHTML = `
      <td class="px-4 py-3">
        <div class="text-slate-300">${dayjs(log.created_at).format("MMM D, YYYY")}</div>
        <div class="text-xs text-slate-500">${dayjs(log.created_at).format("HH:mm:ss")}</div>
        <div class="text-xs text-slate-600">${dayjs(log.created_at).fromNow()}</div>
      </td>
      <td class="px-4 py-3">
        <span class="inline-flex items-center rounded-full bg-${color}-500/20 px-2.5 py-0.5 text-xs font-mono text-${color}-300">
          ${sanitizeHtml(log.action)}
        </span>
      </td>
      <td class="px-4 py-3">
        <div class="text-slate-300">${sanitizeHtml(log.actor_email || "System")}</div>
        <div class="text-xs text-slate-500 font-mono">${sanitizeHtml(log.actor || "—")}</div>
      </td>
      <td class="px-4 py-3 text-slate-400 text-xs">
        ${sanitizeHtml(log.details || "—")}
      </td>
    `;
    
    tbody.appendChild(tr);
  });
}

function updatePagination(page, limit, total) {
  const pageInfo = document.getElementById("page-info");
  const prevBtn = document.getElementById("prev-page");
  const nextBtn = document.getElementById("next-page");
  
  const start = (page - 1) * limit + 1;
  const end = Math.min(page * limit, total);
  pageInfo.textContent = `Showing ${start}–${end} of ${total} logs`;
  
  prevBtn.disabled = page === 1;
  nextBtn.disabled = end >= total;
}
