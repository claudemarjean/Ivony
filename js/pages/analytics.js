import { fetchAnalytics } from "../api.js";
import { showToast } from "../components/toast.js";
import dayjs from "https://cdn.jsdelivr.net/npm/dayjs@1.11.10/+esm";

/**
 * Analytics page
 * Features:
 * - Page views and event tracking
 * - Time-range filtering
 * - Charts and visualizations
 * - Export capabilities (future)
 */
export async function renderAnalytics(container) {
  const wrapper = document.createElement("div");
  wrapper.className = "space-y-6";
  
  // Header
  const header = document.createElement("div");
  header.className = "flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between";
  header.innerHTML = `
    <div>
      <p class="text-xs uppercase tracking-[0.2em] text-slate-500">Insights</p>
      <h2 class="text-2xl font-semibold text-slate-50">Analytics</h2>
      <p class="text-sm text-slate-400">Track user behavior and system metrics</p>
    </div>
    <div class="flex gap-3">
      <select id="time-range" class="rounded-lg border border-slate-800 bg-slate-950/60 px-4 py-2 text-sm text-slate-50">
        <option value="7">Last 7 days</option>
        <option value="30" selected>Last 30 days</option>
        <option value="90">Last 90 days</option>
      </select>
      <button id="refresh-analytics" class="rounded-lg border border-slate-800 bg-slate-900 px-4 py-2 text-sm text-slate-100 hover:border-sky-500/60">⟳ Refresh</button>
    </div>
  `;
  
  // Metrics cards
  const metricsGrid = document.createElement("div");
  metricsGrid.className = "grid gap-4 lg:grid-cols-3";
  metricsGrid.innerHTML = `
    <div class="rounded-2xl border border-slate-800 bg-slate-900/70 p-5 card-shadow">
      <p class="text-xs uppercase tracking-[0.2em] text-slate-500">Page Views</p>
      <div class="mt-3 flex items-end justify-between">
        <div>
          <div id="metric-pageviews" class="text-3xl font-semibold text-slate-50">—</div>
          <p class="text-xs text-slate-400 mt-1">Total views this period</p>
        </div>
        <span id="pageviews-change" class="text-xs text-emerald-300"></span>
      </div>
    </div>
    <div class="rounded-2xl border border-slate-800 bg-slate-900/70 p-5 card-shadow">
      <p class="text-xs uppercase tracking-[0.2em] text-slate-500">Events</p>
      <div class="mt-3 flex items-end justify-between">
        <div>
          <div id="metric-events" class="text-3xl font-semibold text-slate-50">—</div>
          <p class="text-xs text-slate-400 mt-1">Captured client-side</p>
        </div>
        <span id="events-change" class="text-xs text-emerald-300"></span>
      </div>
    </div>
    <div class="rounded-2xl border border-slate-800 bg-slate-900/70 p-5 card-shadow">
      <p class="text-xs uppercase tracking-[0.2em] text-slate-500">Avg Session</p>
      <div class="mt-3 flex items-end justify-between">
        <div>
          <div id="metric-session" class="text-3xl font-semibold text-slate-50">—</div>
          <p class="text-xs text-slate-400 mt-1">Duration in minutes</p>
        </div>
        <span id="session-change" class="text-xs text-sky-300"></span>
      </div>
    </div>
  `;
  
  // Chart section
  const chartSection = document.createElement("div");
  chartSection.className = "grid gap-4 lg:grid-cols-2";
  chartSection.innerHTML = `
    <div class="rounded-2xl border border-slate-800 bg-slate-900/70 p-5 card-shadow">
      <h3 class="text-lg font-semibold text-slate-50 mb-4">Page Views Over Time</h3>
      <canvas id="pageviews-chart" style="max-height: 250px;"></canvas>
    </div>
    <div class="rounded-2xl border border-slate-800 bg-slate-900/70 p-5 card-shadow">
      <h3 class="text-lg font-semibold text-slate-50 mb-4">Top Pages</h3>
      <div id="top-pages" class="space-y-2"></div>
    </div>
  `;
  
  wrapper.appendChild(header);
  wrapper.appendChild(metricsGrid);
  wrapper.appendChild(chartSection);
  container.appendChild(wrapper);
  
  // Load data
  await loadAnalytics(30);
  const chartCleanup = await renderPageViewsChart();
  
  // Event listeners
  header.querySelector("#time-range").addEventListener("change", (e) => {
    loadAnalytics(parseInt(e.target.value));
  });
  
  header.querySelector("#refresh-analytics").addEventListener("click", () => {
    const days = parseInt(header.querySelector("#time-range").value);
    loadAnalytics(days);
    showToast({ title: "Refreshing analytics", variant: "info" });
  });
  
  return chartCleanup;
}

async function loadAnalytics(days = 30) {
  try {
    const startDate = dayjs().subtract(days, "day").toISOString();
    const endDate = dayjs().toISOString();
    const data = await fetchAnalytics({ startDate, endDate });
    
    // Update metrics (use data from API or mock)
    document.getElementById("metric-pageviews").textContent = data.page_views?.toLocaleString() || "18,402";
    document.getElementById("metric-events").textContent = data.events?.toLocaleString() || "56,120";
    document.getElementById("metric-session").textContent = data.avg_session_duration || "4.2";
    
    document.getElementById("pageviews-change").textContent = data.pageviews_change || "+12.5%";
    document.getElementById("events-change").textContent = data.events_change || "+8.3%";
    document.getElementById("session-change").textContent = data.session_change || "+0.8 min";
    
    // Top pages
    const topPages = data.top_pages || [
      { path: "/", views: 5240 },
      { path: "/users", views: 3120 },
      { path: "/applications", views: 2890 },
      { path: "/analytics", views: 1450 },
      { path: "/settings", views: 890 },
    ];
    
    renderTopPages(topPages);
  } catch (error) {
    console.error("Error loading analytics:", error);
    showToast({ title: "Error loading analytics", description: "Using fallback data", variant: "warning" });
    // Set fallback data
    document.getElementById("metric-pageviews").textContent = "18,402";
    document.getElementById("metric-events").textContent = "56,120";
    document.getElementById("metric-session").textContent = "4.2";
  }
}

function renderTopPages(pages) {
  const container = document.getElementById("top-pages");
  container.innerHTML = "";
  
  const maxViews = Math.max(...pages.map(p => p.views));
  
  pages.forEach(page => {
    const percent = (page.views / maxViews) * 100;
    const item = document.createElement("div");
    item.className = "rounded-lg border border-slate-800 bg-slate-950/50 p-3";
    item.innerHTML = `
      <div class="flex items-center justify-between text-sm mb-2">
        <span class="text-slate-50 font-medium">${page.path}</span>
        <span class="text-slate-400">${page.views.toLocaleString()}</span>
      </div>
      <div class="h-2 bg-slate-800 rounded-full overflow-hidden">
        <div class="h-full bg-gradient-to-r from-sky-500 to-indigo-500" style="width: ${percent}%"></div>
      </div>
    `;
    container.appendChild(item);
  });
}

async function renderPageViewsChart() {
  const ctx = document.getElementById("pageviews-chart");
  if (!ctx) return null;
  
  const { Chart } = await import("https://cdn.jsdelivr.net/npm/chart.js@4.4.1/dist/chart.umd.min.js");
  const dataPoints = Array.from({ length: 30 }).map(() => Math.floor(Math.random() * 800) + 400);
  const labels = Array.from({ length: 30 }).map((_, i) => dayjs().subtract(29 - i, "day").format("MMM D"));

  const chart = new Chart(ctx, {
    type: "bar",
    data: {
      labels,
      datasets: [
        {
          label: "Page Views",
          data: dataPoints,
          backgroundColor: "rgba(99, 102, 241, 0.5)",
          borderColor: "#6366f1",
          borderWidth: 1,
        },
      ],
    },
    options: {
      animation: false,
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: { 
          mode: "index", 
          intersect: false,
          backgroundColor: "rgba(15, 23, 42, 0.9)",
        },
      },
      scales: {
        x: { 
          grid: { color: "rgba(148, 163, 184, 0.1)" },
          ticks: { color: "#94a3b8", maxTicksLimit: 10 },
        },
        y: { 
          grid: { color: "rgba(148, 163, 184, 0.1)" },
          ticks: { color: "#94a3b8" },
        },
      },
    },
  });

  return () => chart.destroy();
}
