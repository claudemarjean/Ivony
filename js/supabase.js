import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.45.4/+esm";

/**
 * In-memory storage limits exposure in case of XSS.
 * For multi-tab persistence, switch to sessionStorage.
 * NEVER use localStorage for sensitive tokens.
 */
const memoryStorage = () => {
  const store = new Map();
  return {
    getItem: (key) => store.get(key) ?? null,
    setItem: (key, value) => {
      store.set(key, value);
    },
    removeItem: (key) => {
      store.delete(key);
    },
  };
};

const htmlEl = document.documentElement;
const supabaseUrl = htmlEl.getAttribute("data-supabase-url") || "";
const supabaseAnonKey = htmlEl.getAttribute("data-supabase-anon") || "";

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn("⚠️ Supabase credentials missing. Set data-supabase-url and data-supabase-anon on <html>.");
}

/**
 * Supabase client with security-focused configuration:
 * - PKCE flow for enhanced auth security
 * - sessionStorage (or in-memory) for token storage
 * - Custom headers for request tracking
 * - Auto-refresh tokens before expiry
 */
let supabase;
if (supabaseUrl && supabaseAnonKey) {
  supabase = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: true,
      detectSessionInUrl: true,
      autoRefreshToken: true,
      storage: typeof sessionStorage !== "undefined" ? sessionStorage : memoryStorage(),
      storageKey: "ivony-auth",
      flowType: "pkce", // Proof Key for Code Exchange - prevents auth code interception
    },
    global: {
      headers: {
        "X-Client-Info": "ivony-admin/1.0.0",
        "X-Client-Platform": "web",
      },
    },
    db: {
      schema: "public",
    },
  });
} else {
  // Minimal stub to prevent runtime crashes before configuration
  supabase = {
    auth: {
      getSession: async () => ({ data: { session: null }, error: new Error("Supabase not configured") }),
      signInWithPassword: async () => ({ data: null, error: new Error("Supabase not configured") }),
      signOut: async () => ({ error: null }),
      onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }),
    },
    from: () => ({ 
      select: async () => ({ data: null, error: new Error("Supabase not configured") }),
      insert: async () => ({ data: null, error: new Error("Supabase not configured") }),
      update: async () => ({ data: null, error: new Error("Supabase not configured") }),
      delete: async () => ({ data: null, error: new Error("Supabase not configured") }),
    }),
    rpc: async () => ({ data: null, error: new Error("Supabase not configured") }),
  };
}

export function getSupabaseClient() {
  return supabase;
}

/**
 * Redact sensitive error details to prevent information leakage.
 * NEVER expose database schemas, table names, or internal errors to users.
 * Log full errors server-side for debugging.
 */
export function redactError(error) {
  if (!error) return "An unexpected error occurred";
  if (typeof error === "string") return error;
  
  const message = error.message || "Unknown error";
  
  // Redact sensitive patterns
  const sensitivePatterns = [
    /relation ".*" does not exist/i,
    /column ".*" does not exist/i,
    /permission denied for/i,
    /JWT/i,
    /token/i,
  ];
  
  for (const pattern of sensitivePatterns) {
    if (pattern.test(message)) {
      return "Operation failed. Please check your permissions.";
    }
  }
  
  // Common user-friendly mappings
  if (message.includes("Invalid login")) return "Invalid email or password";
  if (message.includes("not found")) return "Resource not found";
  if (message.includes("already exists")) return "Resource already exists";
  if (message.includes("Network")) return "Network error. Please check your connection.";
  
  return "An error occurred. Please try again.";
}

/**
 * Sanitize HTML to prevent XSS attacks.
 * Use this for ALL user-generated content before rendering.
 */
export function sanitizeHtml(value) {
  if (value === null || value === undefined) return "";
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;")
    .replace(/\//g, "&#x2F;");
}

/**
 * Validate email format (client-side validation only - always validate server-side)
 */
export function isValidEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Validate UUID format to prevent injection attacks
 */
export function isValidUUID(uuid) {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
}
