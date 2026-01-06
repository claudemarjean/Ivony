import { showToast } from "../components/toast.js";
import { showModal, showConfirmDialog } from "../components/modal.js";
import { fetchUsers, updateUserRole, updateUserStatus } from "../api.js";
import { sanitizeHtml } from "../supabase.js";
import dayjs from "https://cdn.jsdelivr.net/npm/dayjs@1.11.10/+esm";

let currentUsers = [];
let currentPage = 1;

/**
 * Users management page
 * Features:
 * - Real-time user list from Supabase
 * - Role and status management
 * - Pagination
 * - Search and filtering
 * - RLS enforced: only admins/managers can access
 */
export async function renderUsers(container) {
  const wrapper = document.createElement("div");
  wrapper.className = "space-y-6";
  
  // Header
  const header = document.createElement("div");
  header.className = "flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between";
  header.innerHTML = `
    <div>
      <p class="text-xs uppercase tracking-[0.2em] text-slate-500">User Directory</p>
      <h2 class="text-2xl font-semibold text-slate-50">Users</h2>
      <p class="text-sm text-slate-400">Manage user roles and permissions • RLS enforced</p>
    </div>
    <div class="flex gap-3">
      <input type="search" id="search-users" placeholder="Search users..." class="rounded-lg border border-slate-800 bg-slate-950/60 px-4 py-2 text-sm text-slate-50 focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500/40" />
      <button id="invite-btn" class="rounded-lg bg-sky-500 px-4 py-2 text-sm font-semibold text-slate-900 shadow hover:bg-sky-600">Invite User</button>
    </div>
  `;
  
  // Users table card
  const card = document.createElement("div");
  card.className = "rounded-2xl border border-slate-800 bg-slate-900/70 p-5 card-shadow";
  card.innerHTML = `
    <div id="loading-state" class="py-8 text-center text-slate-400">
      <div class="inline-block h-8 w-8 animate-spin rounded-full border-4 border-slate-700 border-t-sky-500"></div>
      <p class="mt-2 text-sm">Loading users...</p>
    </div>
    <div id="users-content" class="hidden">
      <div class="overflow-x-auto">
        <table class="min-w-full text-left text-sm text-slate-200">
          <thead class="border-b border-slate-800 text-xs uppercase tracking-wide text-slate-400">
            <tr>
              <th class="px-4 py-3">User</th>
              <th class="px-4 py-3">Role</th>
              <th class="px-4 py-3">Status</th>
              <th class="px-4 py-3">Created</th>
              <th class="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody id="user-rows" class="divide-y divide-slate-800/80"></tbody>
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
    <div id="empty-state" class="hidden py-8 text-center">
      <p class="text-slate-400">No users found</p>
    </div>
  `;
  
  wrapper.appendChild(header);
  wrapper.appendChild(card);
  container.appendChild(wrapper);
  
  // Load users
  await loadUsers();
  
  // Event listeners
  header.querySelector("#invite-btn").addEventListener("click", showInviteModal);
  header.querySelector("#search-users").addEventListener("input", handleSearch);
  card.querySelector("#prev-page").addEventListener("click", () => loadUsers(currentPage - 1));
  card.querySelector("#next-page").addEventListener("click", () => loadUsers(currentPage + 1));
}

async function loadUsers(page = 1) {
  const loadingEl = document.getElementById("loading-state");
  const contentEl = document.getElementById("users-content");
  const emptyEl = document.getElementById("empty-state");
  
  loadingEl.classList.remove("hidden");
  contentEl.classList.add("hidden");
  emptyEl.classList.add("hidden");
  
  try {
    const { users, total, page: currentPageNum, limit } = await fetchUsers({ page, limit: 10 });
    currentUsers = users;
    currentPage = currentPageNum;
    
    if (users.length === 0) {
      emptyEl.classList.remove("hidden");
    } else {
      renderUserRows(users);
      updatePagination(currentPageNum, limit, total);
      contentEl.classList.remove("hidden");
    }
  } catch (error) {
    showToast({ title: "Error loading users", description: error.message, variant: "error" });
    emptyEl.classList.remove("hidden");
  } finally {
    loadingEl.classList.add("hidden");
  }
}

function renderUserRows(users) {
  const tbody = document.getElementById("user-rows");
  tbody.innerHTML = "";
  
  users.forEach((user) => {
    const tr = document.createElement("tr");
    tr.className = "hover:bg-slate-800/50";
    
    const roleColor = user.role === "admin" ? "rose" : user.role === "manager" ? "amber" : "slate";
    const statusColor = user.status === "active" ? "emerald" : "rose";
    
    tr.innerHTML = `
      <td class="px-4 py-3">
        <div class="flex items-center gap-3">
          <div class="h-8 w-8 rounded-full bg-gradient-to-br from-sky-400 to-indigo-500 flex items-center justify-center text-xs font-bold text-slate-900">
            ${sanitizeHtml(user.email.charAt(0).toUpperCase())}
          </div>
          <span class="font-medium">${sanitizeHtml(user.email)}</span>
        </div>
      </td>
      <td class="px-4 py-3">
        <span class="inline-flex items-center rounded-full bg-${roleColor}-500/20 px-2.5 py-0.5 text-xs font-medium text-${roleColor}-300">
          ${sanitizeHtml(user.role)}
        </span>
      </td>
      <td class="px-4 py-3">
        <span class="inline-flex items-center rounded-full bg-${statusColor}-500/20 px-2.5 py-0.5 text-xs font-medium text-${statusColor}-300">
          ${sanitizeHtml(user.status)}
        </span>
      </td>
      <td class="px-4 py-3 text-slate-400">
        ${user.created_at ? dayjs(user.created_at).format("MMM D, YYYY") : "—"}
      </td>
      <td class="px-4 py-3 text-right">
        <div class="flex items-center justify-end gap-2">
          <button class="edit-role-btn rounded-lg border border-slate-700 px-3 py-1 text-xs hover:bg-slate-800" data-user-id="${sanitizeHtml(user.id)}" data-user-email="${sanitizeHtml(user.email)}" data-current-role="${sanitizeHtml(user.role)}">Edit Role</button>
          <button class="toggle-status-btn rounded-lg border border-slate-700 px-3 py-1 text-xs hover:bg-slate-800" data-user-id="${sanitizeHtml(user.id)}" data-current-status="${sanitizeHtml(user.status)}">
            ${user.status === "active" ? "Suspend" : "Activate"}
          </button>
        </div>
      </td>
    `;
    
    tbody.appendChild(tr);
  });
  
  // Attach event listeners
  tbody.querySelectorAll(".edit-role-btn").forEach(btn => {
    btn.addEventListener("click", (e) => {
      const userId = e.target.dataset.userId;
      const email = e.target.dataset.userEmail;
      const currentRole = e.target.dataset.currentRole;
      showEditRoleModal(userId, email, currentRole);
    });
  });
  
  tbody.querySelectorAll(".toggle-status-btn").forEach(btn => {
    btn.addEventListener("click", (e) => {
      const userId = e.target.dataset.userId;
      const currentStatus = e.target.dataset.currentStatus;
      const newStatus = currentStatus === "active" ? "suspended" : "active";
      handleStatusToggle(userId, newStatus);
    });
  });
}

function updatePagination(page, limit, total) {
  const pageInfo = document.getElementById("page-info");
  const prevBtn = document.getElementById("prev-page");
  const nextBtn = document.getElementById("next-page");
  
  const start = (page - 1) * limit + 1;
  const end = Math.min(page * limit, total);
  pageInfo.textContent = `Showing ${start}–${end} of ${total}`;
  
  prevBtn.disabled = page === 1;
  nextBtn.disabled = end >= total;
}

function handleSearch(e) {
  const query = e.target.value.toLowerCase();
  const filtered = currentUsers.filter(u => u.email.toLowerCase().includes(query));
  renderUserRows(filtered);
}

function showInviteModal() {
  showToast({ 
    title: "Invite User", 
    description: "Connect this to your Supabase RPC for user invitations", 
    variant: "info" 
  });
}

function showEditRoleModal(userId, email, currentRole) {
  const form = document.createElement("div");
  form.className = "space-y-4";
  form.innerHTML = `
    <p class="text-sm text-slate-300">Change role for <strong>${sanitizeHtml(email)}</strong></p>
    <div>
      <label class="block text-sm text-slate-300 mb-2">Select Role</label>
      <select id="role-select" class="w-full rounded-lg border border-slate-800 bg-slate-950/60 px-3 py-2 text-slate-50">
        <option value="admin" ${currentRole === "admin" ? "selected" : ""}>Admin</option>
        <option value="manager" ${currentRole === "manager" ? "selected" : ""}>Manager</option>
        <option value="viewer" ${currentRole === "viewer" ? "selected" : ""}>Viewer</option>
      </select>
    </div>
  `;
  
  showModal({
    title: "Edit User Role",
    content: form,
    confirmText: "Update Role",
    onConfirm: async () => {
      const newRole = form.querySelector("#role-select").value;
      await handleRoleChange(userId, newRole);
    },
  });
}

async function handleRoleChange(userId, newRole) {
  try {
    await updateUserRole(userId, newRole);
    showToast({ title: "Role updated", description: `User role changed to ${newRole}`, variant: "success" });
    await loadUsers(currentPage);
  } catch (error) {
    showToast({ title: "Error", description: error.message, variant: "error" });
  }
}

async function handleStatusToggle(userId, newStatus) {
  showConfirmDialog({
    title: "Confirm Status Change",
    message: `Are you sure you want to ${newStatus === "suspended" ? "suspend" : "activate"} this user?`,
    isDangerous: newStatus === "suspended",
    onConfirm: async () => {
      try {
        await updateUserStatus(userId, newStatus);
        showToast({ title: "Status updated", variant: "success" });
        await loadUsers(currentPage);
      } catch (error) {
        showToast({ title: "Error", description: error.message, variant: "error" });
      }
    },
  });
}
