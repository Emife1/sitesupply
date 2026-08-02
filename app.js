/* ═══ SiteSupply — Hash Router & App Logic ═══ */

// ─── Mock Data ───
const SUPPLIERS = [
  { id: 1, name: "Northland Aggregates", category: "Aggregates", location: "Barrie, ON", rating: 4.7, verified: true },
  { id: 2, name: "ProEquip Rentals", category: "Equipment", location: "Toronto, ON", rating: 4.5, verified: true },
  { id: 3, name: "StoneWorks Supply", category: "Aggregates", location: "Mississauga, ON", rating: 4.3, verified: false },
  { id: 4, name: "Alliston Site Services", category: "Sanitation", location: "Alliston, ON", rating: 4.8, verified: true },
  { id: 5, name: "Capital Sand & Gravel", category: "Aggregates", location: "Ottawa, ON", rating: 4.2, verified: false },
  { id: 6, name: "HeavyLift Equipment Co.", category: "Equipment", location: "Hamilton, ON", rating: 4.6, verified: true },
  { id: 7, name: "CleanSite Toilets", category: "Sanitation", location: "Vaughan, ON", rating: 4.4, verified: false },
  { id: 8, name: "Granite Building Stone", category: "Aggregates", location: "Sudbury, ON", rating: 4.9, verified: true },
];

const QUOTES = [
  { id: 101, supplier: "Northland Aggregates", item: "Crushed Stone (3/4\")", quantity: "20 tonnes", price: 385.00, currency: "CAD", delivery: "2-3 days", status: "active" },
  { id: 102, supplier: "ProEquip Rentals", item: "Mini Excavator (1.5T)", quantity: "3 days", price: 620.00, currency: "CAD", delivery: "Available now", status: "active" },
  { id: 103, supplier: "Alliston Site Services", item: "Portable Toilet", quantity: "4 units / 4 weeks", price: 280.00, currency: "CAD", delivery: "1 day", status: "active" },
  { id: 104, supplier: "StoneWorks Supply", item: "Washed Sand", quantity: "15 tonnes", price: 312.00, currency: "CAD", delivery: "3-5 days", status: "pending" },
  { id: 105, supplier: "Capital Sand & Gravel", item: "A Gravel", quantity: "25 tonnes", price: 440.00, currency: "CAD", delivery: "2 days", status: "pending" },
  { id: 106, supplier: "HeavyLift Equipment Co.", item: "Dump Truck Rental", quantity: "1 day", price: 350.00, currency: "CAD", delivery: "Available now", status: "active" },
];

const CATEGORIES = ["All", "Aggregates", "Equipment", "Sanitation", "Stone", "Sand"];

// ─── Router ───
const routes = {
  "/": renderHome,
  "/search": renderSearch,
  "/quotes": renderQuotes,
  "/dashboard": renderDashboard,
  "/suppliers": renderSuppliers,
  "/about": renderAbout,
  "/login": renderLogin,
};

function getRoute() {
  const hash = location.hash.replace("#", "") || "/";
  return hash;
}

function navigate() {
  const route = getRoute();
  const content = document.getElementById("content");
  const render = routes[route] || renderNotFound;

  content.innerHTML = "";
  content.appendChild(render());

  // Update active nav links
  document.querySelectorAll("[data-route]").forEach(el => {
    el.classList.toggle("active", el.dataset.route === route);
  });

  // Close mobile nav
  document.getElementById("mobileNav")?.classList.remove("open");

  // Scroll to top on route change
  window.scrollTo(0, 0);
}

window.addEventListener("hashchange", navigate);

// ─── Mobile Nav Toggle ───
function toggleMobileNav() {
  document.getElementById("mobileNav").classList.toggle("open");
}

// ─── Page Renderers ───
function createElement(tag, className, html) {
  const el = document.createElement(tag);
  if (className) el.className = className;
  if (html !== undefined) el.innerHTML = html;
  return el;
}

function renderHome() {
  const page = createElement("div", "");
  page.innerHTML = `
    <div class="hero">
      <h1>Compare construction supply quotes in seconds</h1>
      <p>SiteSupply aggregates quotes from equipment rentals, aggregates, stone, sand, and sanitation suppliers across North America — so you don't waste hours calling around.</p>
      <div class="hero-cta">
        <a href="#/search"><button class="btn-primary">Search Quotes</button></a>
        <a href="#/suppliers"><button class="btn-outline">Browse Suppliers</button></a>
      </div>
    </div>

    <div class="card" style="margin-bottom:16px;">
      <h3 class="section-title">How it works</h3>
      <div style="display:grid;gap:16px;">
        <div>
          <div style="font-weight:600;font-size:0.9rem;margin-bottom:4px;">1. Search</div>
          <div style="color:var(--text-muted);font-size:0.85rem;">Enter what you need — equipment, aggregates, toilets — and your location.</div>
        </div>
        <div>
          <div style="font-weight:600;font-size:0.9rem;margin-bottom:4px;">2. Compare</div>
          <div style="color:var(--text-muted);font-size:0.85rem;">See quotes from multiple suppliers side by side, with delivery times and distance.</div>
        </div>
        <div>
          <div style="font-weight:600;font-size:0.9rem;margin-bottom:4px;">3. Request</div>
          <div style="color:var(--text-muted);font-size:0.85rem;">Send a quote request directly through SiteSupply. Suppliers respond within hours.</div>
        </div>
      </div>
    </div>

    <div class="card">
      <h3 class="section-title">Recent quotes near you</h3>
      <div class="quote-list">
        ${QUOTES.slice(0, 3).map(quoteCardHTML).join("")}
      </div>
    </div>
  `;
  return page;
}

function renderSearch() {
  const page = createElement("div", "");
  page.innerHTML = `
    <div class="page-hero">
      <h1>Search Quotes</h1>
      <p>Find the best prices from suppliers near you.</p>
    </div>

    <div class="search-bar">
      <div class="form-group">
        <label>What do you need?</label>
        <input class="input" id="searchItem" placeholder="e.g. crushed stone, mini excavator, portable toilet" oninput="filterQuotes()">
      </div>
      <div class="form-group">
        <label>Your location</label>
        <input class="input" id="searchLocation" placeholder="e.g. Alliston, ON" oninput="filterQuotes()">
      </div>
      <button class="btn-primary" onclick="filterQuotes()">Search</button>
    </div>

    <div class="category-pills">
      ${CATEGORIES.map(cat =>
        `<button class="category-pill ${cat === 'All' ? 'active' : ''}" onclick="filterCategory(this, '${cat}')">${cat}</button>`
      ).join("")}
    </div>

    <div id="searchResults" class="quote-list">
      ${QUOTES.map(quoteCardHTML).join("")}
    </div>
  `;
  return page;
}

function filterQuotes() {
  const item = (document.getElementById("searchItem")?.value || "").toLowerCase();
  const results = QUOTES.filter(q =>
    q.item.toLowerCase().includes(item) ||
    q.supplier.toLowerCase().includes(item)
  );
  document.getElementById("searchResults").innerHTML =
    results.length > 0
      ? results.map(quoteCardHTML).join("")
      : `<div class="empty-state"><h3>No quotes found</h3><p>Try a different search term.</p></div>`;
}

function filterCategory(btn, category) {
  document.querySelectorAll(".category-pill").forEach(p => p.classList.remove("active"));
  btn.classList.add("active");
  const results = category === "All"
    ? QUOTES
    : QUOTES.filter(q => {
        const supplier = SUPPLIERS.find(s => s.name === q.supplier);
        return supplier && supplier.category === category;
      });
  document.getElementById("searchResults").innerHTML =
    results.length > 0
      ? results.map(quoteCardHTML).join("")
      : `<div class="empty-state"><h3>No ${category.toLowerCase()} quotes found</h3><p>Try another category.</p></div>`;
}

function quoteCardHTML(q) {
  const supplier = SUPPLIERS.find(s => s.name === q.supplier);
  const badge = `<span class="badge ${q.status === 'active' ? 'badge-active' : 'badge-pending'}">${q.status}</span>`;
  const verified = supplier?.verified ? `<span style="color:var(--emerald);font-size:0.75rem;"> ✓ Verified</span>` : "";
  return `
    <div class="card quote-card">
      <div class="quote-info">
        <div class="quote-supplier">${q.supplier} ${verified}</div>
        <div class="quote-meta">${q.item} · ${q.quantity} · Delivery: ${q.delivery} ${badge}</div>
      </div>
      <div class="quote-price">$${q.price.toFixed(2)} ${q.currency}</div>
    </div>
  `;
}

function renderQuotes() {
  const page = createElement("div", "");
  page.innerHTML = `
    <div class="page-hero">
      <h1>My Quotes</h1>
      <p>Track quotes you've requested and received.</p>
    </div>
    <div class="quote-list">
      ${QUOTES.map(quoteCardHTML).join("")}
    </div>
  `;
  return page;
}

function renderDashboard() {
  const activeCount = QUOTES.filter(q => q.status === "active").length;
  const pendingCount = QUOTES.filter(q => q.status === "pending").length;
  const avgPrice = (QUOTES.reduce((sum, q) => sum + q.price, 0) / QUOTES.length).toFixed(0);

  const page = createElement("div", "");
  page.innerHTML = `
    <div class="page-hero">
      <h1>Dashboard</h1>
      <p>Overview of your supply procurement activity.</p>
    </div>

    <div class="stats-grid">
      <div class="stat-card">
        <div class="stat-label">Active Quotes</div>
        <div class="stat-value">${activeCount}</div>
        <div class="stat-change">+2 this week</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">Pending Response</div>
        <div class="stat-value">${pendingCount}</div>
        <div class="stat-change">Follow up needed</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">Avg. Quote Price</div>
        <div class="stat-value">$${avgPrice}</div>
        <div class="stat-change">CAD · across all categories</div>
      </div>
    </div>

    <div class="card" style="margin-bottom:16px;">
      <h3 class="section-title">Recent activity</h3>
      <div class="quote-list">
        ${QUOTES.slice(0, 4).map(quoteCardHTML).join("")}
      </div>
    </div>

    <div class="card">
      <h3 class="section-title">Top suppliers by response time</h3>
      <div style="display:flex;flex-direction:column;gap:8px;">
        ${SUPPLIERS.slice(0, 4).map(s => `
          <div style="display:flex;justify-content:space-between;align-items:center;padding:8px 0;border-bottom:1px solid var(--border);">
            <div>
              <div style="font-weight:600;font-size:0.85rem;">${s.name}${s.verified ? ' ✓' : ''}</div>
              <div style="color:var(--text-muted);font-size:0.75rem;">${s.location} ·⭐${s.rating}</div>
            </div>
            <button class="btn-outline" style="padding:6px 12px;font-size:0.75rem;" onclick="location.hash='#/search'">Request quote</button>
          </div>
        `).join("")}
      </div>
    </div>
  `;
  return page;
}

function renderSuppliers() {
  const page = createElement("div", "");
  page.innerHTML = `
    <div class="page-hero">
      <h1>Suppliers</h1>
      <p>Browse verified and community suppliers across North America.</p>
    </div>
    <div class="supplier-grid">
      ${SUPPLIERS.map(s => `
        <div class="card">
          <div style="display:flex;justify-content:space-between;align-items:start;margin-bottom:8px;">
            <div style="font-weight:600;font-size:0.95rem;">${s.name}</div>
            ${s.verified ? '<span class="badge badge-active">Verified</span>' : '<span class="badge badge-pending">Community</span>'}
          </div>
          <div style="color:var(--text-muted);font-size:0.8rem;margin-bottom:8px;">${s.category} · ${s.location}</div>
          <div style="font-size:0.85rem;margin-bottom:12px;">⭐ ${s.rating} / 5.0</div>
          <button class="btn-primary" style="width:100%;" onclick="location.hash='#/search'">Request Quote</button>
        </div>
      `).join("")}
    </div>
  `;
  return page;
}

function renderAbout() {
  const page = createElement("div", "");
  page.innerHTML = `
    <div class="page-hero">
      <h1>About SiteSupply</h1>
      <p>The construction supply quote aggregator for North America.</p>
    </div>
    <div class="card" style="max-width:680px;">
      <p style="color:var(--text-muted);font-size:0.95rem;line-height:1.7;margin-bottom:16px;">
        SiteSupply was born from a real pain point in the construction industry: <strong style="color:var(--text);">procurement takes too long</strong>. Companies spend hours calling multiple suppliers to compare prices for equipment rentals, aggregates, stone, sand, and site sanitation — often waiting days for quotes to come back.
      </p>
      <p style="color:var(--text-muted);font-size:0.95rem;line-height:1.7;margin-bottom:16px;">
        Inspired by the Trivago model but built for industrial supply chains, SiteSupply aggregates quotes from multiple suppliers so you can compare prices, delivery times, and supplier ratings in one place — then request directly through the platform.
      </p>
      <p style="color:var(--text-muted);font-size:0.95rem;line-height:1.7;">
        Currently serving Ontario-based construction companies with a growing network of suppliers across Canada and the US.
      </p>
    </div>
  `;
  return page;
}

function renderLogin() {
  const page = createElement("div", "");
  page.innerHTML = `
    <div class="login-wrap">
      <div class="login-card">
        <h2>Sign in to SiteSupply</h2>
        <p>Access your quotes and supplier dashboard.</p>
        <div class="form-group">
          <label>Work email</label>
          <input class="input" type="email" placeholder="name@work-email.com">
        </div>
        <button class="btn-primary" onclick="alert('Authentication coming soon — demo mode active.')">Continue with Email</button>
        <div class="login-divider"></div>
        <button class="social-btn">Continue with Google</button>
        <button class="social-btn">Continue with GitHub</button>
        <p style="font-size:0.75rem;color:var(--text-dim);margin-top:16px;text-align:center;">
          By proceeding, you agree to our Terms of Service and Privacy Policy.
        </p>
      </div>
    </div>
  `;
  return page;
}

function renderNotFound() {
  const page = createElement("div", "");
  page.innerHTML = `
    <div class="empty-state">
      <h3>Page not found</h3>
      <p>The page you're looking for doesn't exist.</p>
      <br>
      <a href="#/"><button class="btn-primary">Go Home</button></a>
    </div>
  `;
  return page;
}

// ─── Init ───
navigate();
