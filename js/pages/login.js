import { login } from "../auth.js";
import { navigateTo } from "../router.js";
import { showToast } from "../components/toast.js";
import { sanitizeHtml } from "../supabase.js";

/**
 * Login page with secure authentication
 * Features:
 * - Input validation and sanitization
 * - Rate limiting (handled in auth.js)
 * - Secure error messages (no information leakage)
 * - Loading states
 */
export function navigateToLoginView(container) {
  container.innerHTML = "";
  const card = document.createElement("div");
  card.className = "mx-auto max-w-md rounded-2xl border border-slate-800 bg-slate-900/80 p-8 card-shadow";
  card.innerHTML = `
    <div class="mb-6">
      <div class="mx-auto mb-4 h-16 w-16 rounded-2xl bg-gradient-to-br from-sky-400 to-indigo-500 flex items-center justify-center">
        <span class="text-2xl font-black text-slate-900">IV</span>
      </div>
      <p class="text-xs uppercase tracking-[0.2em] text-slate-500 text-center">Secure Access</p>
      <h2 class="text-2xl font-semibold text-slate-50 text-center">Sign In</h2>
      <p class="mt-2 text-sm text-slate-400 text-center">Zero-trust architecture • Session-based auth • RLS enforced</p>
    </div>
    <form id="login-form" class="space-y-4" novalidate>
      <div>
        <label class="block text-sm text-slate-300" for="email">Email</label>
        <input id="email" name="email" type="email" autocomplete="username" required class="mt-1 w-full rounded-lg border border-slate-800 bg-slate-950/60 px-3 py-2 text-slate-50 focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500/40" placeholder="admin@company.com" />
      </div>
      <div>
        <label class="block text-sm text-slate-300" for="password">Password</label>
        <input id="password" name="password" type="password" autocomplete="current-password" required minlength="8" class="mt-1 w-full rounded-lg border border-slate-800 bg-slate-950/60 px-3 py-2 text-slate-50 focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500/40" placeholder="••••••••" />
      </div>
      <button type="submit" class="w-full rounded-lg bg-gradient-to-r from-sky-500 to-indigo-500 px-4 py-2.5 text-sm font-semibold text-slate-950 shadow-lg shadow-sky-800/30 hover:shadow-sky-700/40 transition-all focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-400">Sign in</button>
    </form>
    <p id="login-error" class="mt-3 text-sm text-rose-300 min-h-[20px]"></p>
    <div class="mt-6 pt-6 border-t border-slate-800">
      <p class="text-xs text-slate-500 text-center">Protected by rate limiting • Max 5 attempts per 15 min</p>
    </div>
  `;

  const form = card.querySelector("#login-form");
  const errorEl = card.querySelector("#login-error");
  const submitBtn = form.querySelector("button[type=submit]");
  
  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    errorEl.textContent = "";

    const email = sanitize(form.email.value);
    const password = form.password.value;
    
    if (!email || !password) {
      errorEl.textContent = "Email and password are required";
      return;
    }

    submitBtn.disabled = true;
    submitBtn.textContent = "Authenticating...";

    try {
      await login({ email, password });
      showToast({ 
        title: "Welcome back!", 
        description: "Authentication successful", 
        variant: "success" 
      });
      navigateTo("/");
    } catch (err) {
      errorEl.textContent = err.message;
      // Shake animation on error
      card.style.animation = "shake 0.3s";
      setTimeout(() => card.style.animation = "", 300);
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = "Sign in";
    }
  });

  container.appendChild(card);
}

function sanitize(value) {
  return String(value || "").trim();
}
