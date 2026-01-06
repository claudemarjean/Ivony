import { getSupabaseClient, redactError, isValidEmail } from "./supabase.js";
import { getState, setState, resetAuthState } from "./state.js";
import { showToast } from "./components/toast.js";

/**
 * Security: Rate limiting and account lockout
 * Prevents brute-force attacks on login
 */
const MAX_ATTEMPTS = 5;
const LOCKOUT_MS = 5 * 60 * 1000; // 5 minutes
const ATTEMPT_WINDOW_MS = 15 * 60 * 1000; // 15 minutes

function now() {
  return Date.now();
}

/**
 * Restore session from storage on app load.
 * Validates JWT and refreshes if needed.
 */
export async function restoreSession() {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase.auth.getSession();
  
  if (error) {
    console.warn("Failed to restore session:", redactError(error));
    return null;
  }
  
  if (data?.session?.user) {
    const role = data.session.user.user_metadata?.role || "viewer";
    setState({
      user: data.session.user,
      session: data.session,
      role,
      isAuthenticated: true,
    });
    console.info("✓ Session restored for:", data.session.user.email);
  }
  
  return data?.session ?? null;
}

/**
 * Login with email/password
 * Includes rate limiting, validation, and secure error handling
 */
export async function login({ email, password }) {
  // Input validation
  if (!email || !password) {
    throw new Error("Email and password are required");
  }
  
  if (!isValidEmail(email)) {
    throw new Error("Invalid email format");
  }
  
  if (password.length < 8) {
    throw new Error("Password must be at least 8 characters");
  }
  
  // Rate limiting check
  const state = getState();
  const nowTs = now();
  
  // Reset attempt counter if outside window
  if (nowTs - state.lastAuthAttempt > ATTEMPT_WINDOW_MS) {
    setState({ authAttemptCount: 0 });
  }
  
  // Check for lockout
  if (state.authAttemptCount >= MAX_ATTEMPTS && nowTs - state.lastAuthAttempt < LOCKOUT_MS) {
    const remainingMs = LOCKOUT_MS - (nowTs - state.lastAuthAttempt);
    const remainingMin = Math.ceil(remainingMs / 60000);
    throw new Error(`Too many failed attempts. Please try again in ${remainingMin} minute${remainingMin > 1 ? 's' : ''}.`);
  }

  const supabase = getSupabaseClient();
  const { data, error } = await supabase.auth.signInWithPassword({ 
    email: email.trim().toLowerCase(), 
    password 
  });

  // Increment attempt counter
  setState({ 
    authAttemptCount: state.authAttemptCount + 1, 
    lastAuthAttempt: nowTs 
  });

  if (error) {
    console.error("Login failed:", error.message);
    throw new Error(redactError(error));
  }

  if (data.session?.user) {
    const role = data.session.user.user_metadata?.role || "viewer";
    setState({
      user: data.session.user,
      session: data.session,
      role,
      isAuthenticated: true,
      authAttemptCount: 0, // Reset on successful login
    });
    console.info("✓ Login successful:", data.session.user.email, "| Role:", role);
  }
  
  return data.session;
}

/**
 * Logout and clear all session data
 */
export async function logout() {
  const supabase = getSupabaseClient();
  const { error } = await supabase.auth.signOut();
  
  if (error) {
    console.warn("Logout error:", redactError(error));
  }
  
  resetAuthState();
  console.info("✓ User logged out");
}

/**
 * Check if current user has required role
 */
export function requireRole(allowedRoles) {
  const { role } = getState();
  return allowedRoles.includes(role);
}

/**
 * Subscribe to auth state changes (login/logout events)
 */
export function onAuthStateChange(callback) {
  const supabase = getSupabaseClient();
  return supabase.auth.onAuthStateChange((event, session) => {
    console.info("Auth event:", event);
    
    if (session?.user) {
      const role = session.user.user_metadata?.role || "viewer";
      setState({ 
        user: session.user, 
        session, 
        role, 
        isAuthenticated: true 
      });
    }
    
    if (event === "SIGNED_OUT") {
      resetAuthState();
    }
    
    callback(event, session);
  });
}

/**
 * Assert user is authenticated, throw error if not
 */
export function assertAuthenticated() {
  const { isAuthenticated } = getState();
  if (!isAuthenticated) {
    throw new Error("Authentication required");
  }
}

/**
 * Handle authentication errors with user-friendly messages
 */
export function handleAuthError(err) {
  const message = redactError(err);
  showToast({ 
    title: "Authentication error", 
    description: message, 
    variant: "error" 
  });
}

/**
 * Get current user's session token (for API calls)
 * Returns null if not authenticated
 */
export async function getSessionToken() {
  const supabase = getSupabaseClient();
  const { data } = await supabase.auth.getSession();
  return data?.session?.access_token ?? null;
}
