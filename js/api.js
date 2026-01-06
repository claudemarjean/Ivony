import { getSupabaseClient, redactError, sanitizeHtml, isValidUUID, isValidEmail } from "./supabase.js";
import { assertAuthenticated } from "./auth.js";

/**
 * Sanitize and validate input payloads
 * Prevents injection attacks and ensures data integrity
 */
function sanitizePayload(payload) {
  const safe = {};
  Object.entries(payload || {}).forEach(([key, value]) => {
    if (typeof value === "string") {
      safe[key] = value.trim();
    } else if (typeof value === "number" || typeof value === "boolean") {
      safe[key] = value;
    } else if (value === null || value === undefined) {
      safe[key] = null;
    } else {
      // Skip complex objects to prevent prototype pollution
      console.warn(`Skipping complex value for key: ${key}`);
    }
  });
  return safe;
}

/**
 * Validate pagination parameters
 */
function validatePagination({ page = 1, limit = 50 } = {}) {
  const safePage = Math.max(1, Math.min(1000, parseInt(page, 10) || 1));
  const safeLimit = Math.max(1, Math.min(100, parseInt(limit, 10) || 50));
  return { page: safePage, limit: safeLimit };
}

/* ==================== USERS API ==================== */

/**
 * Fetch users list with pagination
 * Required role: admin, manager
 * RLS Policy: users_view restricts access based on role
 */
export async function fetchUsers({ page, limit } = {}) {
  assertAuthenticated();
  const { page: safePage, limit: safeLimit } = validatePagination({ page, limit });
  const offset = (safePage - 1) * safeLimit;
  
  const supabase = getSupabaseClient();
  const { data, error, count } = await supabase
    .from("users_view")
    .select("id, email, role, status, created_at", { count: "exact" })
    .order("created_at", { ascending: false })
    .range(offset, offset + safeLimit - 1);
  
  if (error) {
    console.error("fetchUsers error:", error);
    throw new Error(redactError(error));
  }
  
  return { 
    users: data || [], 
    total: count || 0,
    page: safePage,
    limit: safeLimit
  };
}

/**
 * Update user role
 * Required role: admin
 * Validates UUID and role value
 */
export async function updateUserRole(userId, newRole) {
  assertAuthenticated();
  
  if (!isValidUUID(userId)) {
    throw new Error("Invalid user ID");
  }
  
  const validRoles = ["admin", "manager", "viewer"];
  if (!validRoles.includes(newRole)) {
    throw new Error("Invalid role");
  }
  
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .rpc("update_user_role", { 
      target_user_id: userId, 
      new_role: newRole 
    });
  
  if (error) {
    console.error("updateUserRole error:", error);
    throw new Error(redactError(error));
  }
  
  return data;
}

/**
 * Suspend/activate user account
 * Required role: admin
 */
export async function updateUserStatus(userId, status) {
  assertAuthenticated();
  
  if (!isValidUUID(userId)) {
    throw new Error("Invalid user ID");
  }
  
  const validStatuses = ["active", "suspended"];
  if (!validStatuses.includes(status)) {
    throw new Error("Invalid status");
  }
  
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .rpc("update_user_status", { 
      target_user_id: userId, 
      new_status: status 
    });
  
  if (error) {
    console.error("updateUserStatus error:", error);
    throw new Error(redactError(error));
  }
  
  return data;
}

/* ==================== APPLICATIONS API ==================== */

/**
 * Fetch applications with optional filtering
 * Required role: admin, manager, viewer
 */
export async function fetchApplications({ page, limit, status } = {}) {
  assertAuthenticated();
  const { page: safePage, limit: safeLimit } = validatePagination({ page, limit });
  const offset = (safePage - 1) * safeLimit;
  
  const supabase = getSupabaseClient();
  let query = supabase
    .from("applications")
    .select("id, name, description, status, owner, created_at, updated_at", { count: "exact" })
    .order("created_at", { ascending: false })
    .range(offset, offset + safeLimit - 1);
  
  if (status) {
    query = query.eq("status", status);
  }
  
  const { data, error, count } = await query;
  
  if (error) {
    console.error("fetchApplications error:", error);
    throw new Error(redactError(error));
  }
  
  return { 
    applications: data || [], 
    total: count || 0,
    page: safePage,
    limit: safeLimit
  };
}

/**
 * Create new application
 * Required role: admin, manager
 * Validates and sanitizes input
 */
export async function createApplication(app) {
  assertAuthenticated();
  
  if (!app.name || app.name.length < 3) {
    throw new Error("Application name must be at least 3 characters");
  }
  
  const payload = sanitizePayload({
    name: app.name,
    description: app.description || "",
    owner: app.owner || "",
    status: app.status || "draft",
  });
  
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from("applications")
    .insert(payload)
    .select()
    .single();
  
  if (error) {
    console.error("createApplication error:", error);
    throw new Error(redactError(error));
  }
  
  return data;
}

/**
 * Update application
 * Required role: admin, manager
 * IDOR protection: RLS ensures users can only update their own apps
 */
export async function updateApplication(appId, updates) {
  assertAuthenticated();
  
  if (!isValidUUID(appId)) {
    throw new Error("Invalid application ID");
  }
  
  const payload = sanitizePayload(updates);
  
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from("applications")
    .update(payload)
    .eq("id", appId)
    .select()
    .single();
  
  if (error) {
    console.error("updateApplication error:", error);
    throw new Error(redactError(error));
  }
  
  return data;
}

/**
 * Delete application
 * Required role: admin
 */
export async function deleteApplication(appId) {
  assertAuthenticated();
  
  if (!isValidUUID(appId)) {
    throw new Error("Invalid application ID");
  }
  
  const supabase = getSupabaseClient();
  const { error } = await supabase
    .from("applications")
    .delete()
    .eq("id", appId);
  
  if (error) {
    console.error("deleteApplication error:", error);
    throw new Error(redactError(error));
  }
  
  return true;
}

/* ==================== AUDIT LOGS API ==================== */

/**
 * Fetch audit logs (read-only)
 * Required role: admin
 * RLS: Only admins can access audit logs
 */
export async function fetchAuditLogs({ page, limit, action, actorId } = {}) {
  assertAuthenticated();
  const { page: safePage, limit: safeLimit } = validatePagination({ page, limit });
  const offset = (safePage - 1) * safeLimit;
  
  const supabase = getSupabaseClient();
  let query = supabase
    .from("audit_logs")
    .select("id, action, actor, actor_email, details, created_at", { count: "exact" })
    .order("created_at", { ascending: false })
    .range(offset, offset + safeLimit - 1);
  
  if (action) {
    query = query.eq("action", action);
  }
  
  if (actorId && isValidUUID(actorId)) {
    query = query.eq("actor", actorId);
  }
  
  const { data, error, count } = await query;
  
  if (error) {
    console.error("fetchAuditLogs error:", error);
    throw new Error(redactError(error));
  }
  
  return { 
    logs: data || [], 
    total: count || 0,
    page: safePage,
    limit: safeLimit
  };
}

/* ==================== ANALYTICS API ==================== */

/**
 * Fetch analytics data
 * Required role: admin, manager, viewer
 */
export async function fetchAnalytics({ startDate, endDate } = {}) {
  assertAuthenticated();
  
  const supabase = getSupabaseClient();
  const { data, error } = await supabase.rpc("get_analytics_summary", {
    start_date: startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
    end_date: endDate || new Date().toISOString(),
  });
  
  if (error) {
    console.error("fetchAnalytics error:", error);
    throw new Error(redactError(error));
  }
  
  return data || {};
}

/* ==================== DASHBOARD API ==================== */

/**
 * Fetch dashboard KPIs
 * Required role: admin, manager, viewer
 */
export async function fetchDashboardKPIs() {
  assertAuthenticated();
  
  const supabase = getSupabaseClient();
  const { data, error } = await supabase.rpc("get_dashboard_kpis");
  
  if (error) {
    console.error("fetchDashboardKPIs error:", error);
    throw new Error(redactError(error));
  }
  
  return data || {
    active_users: 0,
    total_applications: 0,
    total_projects: 0,
    logs_24h: 0,
  };
}
