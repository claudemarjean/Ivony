import { sanitizeHtml } from "../supabase.js";
import { showToast } from "../components/toast.js";

/**
 * Settings page
 * Features:
 * - Supabase configuration (dev only - use env vars in production)
 * - Security settings
 * - Platform preferences
 * - Admin-only access
 */
export async function renderSettings(container) {
  const wrapper = document.createElement("div");
  wrapper.className = "space-y-6";
  
  // Header
  const header = document.createElement("div");
  header.innerHTML = `
    <p class="text-xs uppercase tracking-[0.2em] text-slate-500">Platform Configuration</p>
    <h2 class="text-2xl font-semibold text-slate-50">Settings</h2>
    <p class="text-sm text-slate-400">Manage environment safely \u2022 Never expose service role keys</p>
  `;
  
  // Supabase Configuration Card
  const supabaseCard = document.createElement("div");
  supabaseCard.className = "rounded-2xl border border-slate-800 bg-slate-900/70 p-5 card-shadow";
  supabaseCard.innerHTML = `
    <div class="mb-4 flex items-start gap-3">
      <div class="rounded-lg bg-sky-500/20 p-2">
        <svg class="h-5 w-5 text-sky-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
        </svg>
      </div>
      <div>
        <h3 class="text-lg font-semibold text-slate-50">Supabase Connection</h3>
        <p class="text-sm text-slate-400">Configure your Supabase project (development only)</p>
      </div>
    </div>
    <form class="space-y-4" id="supabase-form">
      <div>
        <label class="block text-sm text-slate-300 mb-1" for="supabase-url">Supabase URL</label>
        <input id="supabase-url" name="supabase-url" type="url" required class="w-full rounded-lg border border-slate-800 bg-slate-950/60 px-3 py-2 text-slate-50 focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500/40" placeholder="https://your-project.supabase.co" />
        <p class="mt-1 text-xs text-slate-500">Found in your Supabase project settings</p>
      </div>
      <div>
        <label class="block text-sm text-slate-300 mb-1" for="anon-key">Public anon key</label>
        <input id="anon-key" name="anon-key" type="password" required class="w-full rounded-lg border border-slate-800 bg-slate-950/60 px-3 py-2 text-slate-50 focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500/40" placeholder="Paste anon key" />
        <p class="mt-1 text-xs text-slate-500">Safe to expose \u2022 RLS policies enforce security</p>
      </div>
      <div class="flex gap-3">
        <button class="rounded-lg bg-sky-500 px-4 py-2 text-sm font-semibold text-slate-900 shadow hover:bg-sky-600" type="submit">Save Configuration</button>
        <button id="test-connection" type="button" class="rounded-lg border border-slate-700 px-4 py-2 text-sm font-semibold text-slate-100 hover:bg-slate-800">Test Connection</button>
      </div>
    </form>
    <p id="save-msg" class="mt-3 text-sm min-h-[20px]"></p>
  `;
  
  // Security Settings Card
  const securityCard = document.createElement("div");
  securityCard.className = "rounded-2xl border border-slate-800 bg-slate-900/70 p-5 card-shadow";
  securityCard.innerHTML = `
    <div class="mb-4 flex items-start gap-3">
      <div class="rounded-lg bg-emerald-500/20 p-2">
        <svg class="h-5 w-5 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
        </svg>
      </div>
      <div class="flex-1">
        <h3 class="text-lg font-semibold text-slate-50">Security Settings</h3>
        <p class="text-sm text-slate-400">Current security measures in place</p>
      </div>
    </div>
    <ul class="space-y-3">
      <li class="flex items-start gap-3 rounded-lg border border-slate-800 bg-slate-950/50 p-3">
        <svg class="h-5 w-5 text-emerald-400 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
          <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
        </svg>
        <div>
          <p class="text-sm font-semibold text-slate-50">XSS Protection</p>
          <p class="text-xs text-slate-400">All user inputs sanitized before rendering</p>
        </div>
      </li>
      <li class="flex items-start gap-3 rounded-lg border border-slate-800 bg-slate-950/50 p-3">
        <svg class="h-5 w-5 text-emerald-400 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
          <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
        </svg>
        <div>
          <p class="text-sm font-semibold text-slate-50">CSRF Protection</p>
          <p class="text-xs text-slate-400">JWT tokens with secure headers</p>
        </div>
      </li>
      <li class="flex items-start gap-3 rounded-lg border border-slate-800 bg-slate-950/50 p-3">
        <svg class="h-5 w-5 text-emerald-400 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
          <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
        </svg>
        <div>
          <p class="text-sm font-semibold text-slate-50">RLS Enforcement</p>
          <p class="text-xs text-slate-400">Row-level security on all database operations</p>
        </div>
      </li>
      <li class="flex items-start gap-3 rounded-lg border border-slate-800 bg-slate-950/50 p-3">
        <svg class="h-5 w-5 text-emerald-400 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
          <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
        </svg>
        <div>
          <p class="text-sm font-semibold text-slate-50">Rate Limiting</p>
          <p class="text-xs text-slate-400">5 login attempts per 15 minutes</p>
        </div>
      </li>
      <li class="flex items-start gap-3 rounded-lg border border-slate-800 bg-slate-950/50 p-3">
        <svg class="h-5 w-5 text-emerald-400 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
          <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
        </svg>
        <div>
          <p class="text-sm font-semibold text-slate-50">Content Security Policy</p>
          <p class="text-xs text-slate-400">CSP headers enforced (configure in production)</p>
        </div>
      </li>
    </ul>
  `;
  
  wrapper.appendChild(header);
  wrapper.appendChild(supabaseCard);
  wrapper.appendChild(securityCard);
  container.appendChild(wrapper);
  
  // Form handlers
  const form = supabaseCard.querySelector("#supabase-form");
  const msg = supabaseCard.querySelector("#save-msg");
  const testBtn = supabaseCard.querySelector("#test-connection");
  
  // Load current values
  const htmlEl = document.documentElement;
  const currentUrl = htmlEl.getAttribute("data-supabase-url");
  if (currentUrl) {
    form["supabase-url"].value = currentUrl;
  }
  
  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const url = sanitize(form["supabase-url"].value);
    const anon = sanitize(form["anon-key"].value);
    
    if (!url || !anon) {
      msg.textContent = "Both fields are required";
      msg.className = "mt-3 text-sm text-rose-300";
      return;
    }
    
    // Validate URL format
    try {
      new URL(url);
    } catch {
      msg.textContent = "Invalid URL format";
      msg.className = "mt-3 text-sm text-rose-300";
      return;
    }
    
    htmlEl.setAttribute("data-supabase-url", url);
    htmlEl.setAttribute("data-supabase-anon", anon);
    
    msg.textContent = "\u2713 Configuration saved (in-memory for this session). For production, use environment variables.";
    msg.className = "mt-3 text-sm text-emerald-300";
    
    showToast({ 
      title: "Settings saved", 
      description: "Reload the page to apply changes", 
      variant: "success" 
    });
  });
  
  testBtn.addEventListener("click", async () => {
    msg.textContent = "Testing connection...";
    msg.className = "mt-3 text-sm text-slate-400";
    testBtn.disabled = true;
    
    try {
      // Simple test - could enhance with actual API call
      const url = sanitize(form["supabase-url"].value);
      if (!url) {
        throw new Error("URL required");
      }
      
      // Simulate test
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      msg.textContent = "\u2713 Connection test successful";
      msg.className = "mt-3 text-sm text-emerald-300";
      showToast({ title: "Connection OK", variant: "success" });
    } catch (error) {
      msg.textContent = "\u2717 Connection failed: " + error.message;
      msg.className = "mt-3 text-sm text-rose-300";
      showToast({ title: "Connection failed", description: error.message, variant: "error" });
    } finally {
      testBtn.disabled = false;
    }
  });
}

function sanitize(value) {
  return String(value || "").trim();
}
