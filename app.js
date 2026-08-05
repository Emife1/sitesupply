import { CATEGORIES, NAV_ITEMS, SUPPLIERS, PROJECTS, MESSAGES, METRICS, PORTAL_LEADS } from './data.js';

const state = {
  route: 'home',
  currency: 'CAD',
  activeCategory: 'aggregates',
  query: '',
  country: 'ALL',
  quoteInputs: {},
  selectedProject: PROJECTS[0].id,
  selectedSupplier: SUPPLIERS[0].id,
  role: 'buyer'
};

const rate = 1.37;
const app = document.getElementById('app');
let mapInstance = null;

const money = (value, currency = state.currency) => {
  const n = currency === 'USD' ? value / rate : value;
  return new Intl.NumberFormat('en-CA', { style: 'currency', currency, maximumFractionDigits: 0 }).format(n);
};

const setRoute = route => {
  state.route = route;
  render();
  window.scrollTo({ top: 0, behavior: 'smooth' });
};

const setCurrency = currency => {
  state.currency = currency;
  render();
};

const setRole = role => {
  state.role = role;
  state.route = role === 'supplier' ? 'supplier-portal' : 'home';
  render();
};

const currentCategory = () => CATEGORIES[state.activeCategory];

const navLink = item => `<button class="nav-link ${state.route === item.id ? 'active' : ''}" data-route="${item.id}">${item.label}</button>`;
const mobileLink = item => `<button class="mobile-link ${state.route === item.id ? 'active' : ''}" data-route="${item.id}"><span>•</span><span>${item.label}</span></button>`;

const hero = (title, subtitle, actions = '') => `
  <section class="hero">
    <div class="hero-top">
      <div>
        <div class="kicker">Industrial precision · digital trust</div>
        <h1>${title}</h1>
        <p>${subtitle}</p>
      </div>
      <div class="topbar-actions">
        <button class="pill ${state.currency === 'CAD' ? 'primary' : ''}" data-currency="CAD">CAD</button>
        <button class="pill ${state.currency === 'USD' ? 'primary' : ''}" data-currency="USD">USD</button>
        <button class="pill accent" data-role-switch>${state.role === 'buyer' ? 'Buyer view' : 'Supplier view'}</button>
      </div>
    </div>
    <div class="hero-actions">${actions}</div>
  </section>`;

const statGrid = stats => `<section class="grid-4">${stats.map(s => `
  <div class="stat"><div class="label">${s.label}</div><div class="value">${s.value}</div><div class="hint">${s.hint}</div></div>`).join('')}</section>`;

const supplierCard = s => `
  <div class="card" data-supplier="${s.id}">
    <div class="card-row">
      <div>
        <h3>${s.name}</h3>
        <p>${s.city}</p>
      </div>
      <span class="badge">★ ${s.rating.toFixed(1)}</span>
    </div>
    <p>${s.tags.map(t => `<span class="tag">${t}</span>`).join(' ')}</p>
    <div class="card-actions">
      <span class="tag">${s.website}</span>
      <span class="tag">${s.phone}</span>
    </div>
  </div>`;

const projectCard = p => `
  <div class="card ${state.selectedProject === p.id ? 'selected' : ''}" data-project="${p.id}">
    <div class="card-row">
      <div>
        <h3>${p.name}</h3>
        <p>${p.location}</p>
      </div>
      <span class="chip">${p.stage}</span>
    </div>
    <div class="card-actions">
      <span class="tag">${p.budget}</span>
      <span class="tag">${p.supplierCount} suppliers</span>
      <span class="tag">Updated ${p.updated}</span>
    </div>
  </div>`;

const selectedProject = () => PROJECTS.find(p => p.id === state.selectedProject) || PROJECTS[0];
const selectedSupplier = () => SUPPLIERS.find(s => s.id === state.selectedSupplier) || SUPPLIERS[0];

const quoteEngine = (categoryId, inputs = {}) => {
  const category = CATEGORIES[categoryId];
  const base = { aggregates: 128, rental: 265, freight: 420 }[categoryId] || 150;
  const adjust = categoryId === 'aggregates'
    ? Number(inputs.quantity || 250) * 0.16
    : categoryId === 'rental'
      ? Number(inputs.days || 5) * 38
      : Number(inputs.distance || 145) * 0.95 + Number(inputs.weight || 18) * 8;

  return SUPPLIERS
    .filter(s => s.categories.includes(categoryId))
    .map(s => {
      const distancePenalty = 1 + (s.country === 'US' ? 0.12 : 0.04);
      const ratingDiscount = (5 - s.rating) * 0.045;
      const categoryBonus = categoryId === 'freight' ? 1.08 : categoryId === 'rental' ? 0.98 : 1;
      const price = (base + adjust) * distancePenalty * categoryBonus * (1 + ratingDiscount);
      const eta = categoryId === 'rental' ? `${1 + Math.floor((5 - s.rating) * 1.4)} day${s.rating > 4.5 ? '' : 's'}` : `${1 + Math.floor((5 - s.rating) * 2)} day${s.rating > 4.6 ? '' : 's'}`;
      return {
        ...s,
        price,
        eta,
        score: Math.round((s.rating * 20) + (s.country === 'CA' ? 10 : 2))
      };
    })
    .sort((a, b) => a.price - b.price)
    .slice(0, 6);
};

const formValue = (categoryId, field) => {
  const saved = state.quoteInputs[categoryId]?.[field.id];
  if (saved !== undefined) return saved;
  return field.value ?? '';
};

const categoryPage = category => {
  const inputs = state.quoteInputs[category.id] || {};
  const quotes = quoteEngine(category.id, inputs);
  const fields = category.fields.map(field => {
    const value = formValue(category.id, field);
    if (field.type === 'select') {
      return `<div><label class="panel-sub">${field.label}</label><select class="select" name="${field.id}">${field.options.map(opt => `<option ${opt === value ? 'selected' : ''}>${opt}</option>`).join('')}</select></div>`;
    }
    return `<div><label class="panel-sub">${field.label}</label><input class="input" name="${field.id}" type="${field.type}" value="${value}" min="${field.min ?? ''}" placeholder="${field.placeholder || ''}" /></div>`;
  }).join('');

  return `
    ${hero(category.name + ' quotes', category.description, `
      <button class="button primary" data-route="suppliers">Open supplier directory</button>
      <button class="button secondary" data-route="projects">Open projects</button>
    `)}
    <section class="panel">
      <div class="panel-head">
        <div>
          <h2 class="panel-title">Estimate request</h2>
          <p class="panel-sub">${category.helper}</p>
        </div>
        <span class="chip">Live comparison</span>
      </div>
      <form class="form-grid" data-quote-form="${category.id}">
        ${fields}
        <div class="full"><button class="button cta" type="submit">Compare quotes</button></div>
      </form>
    </section>
    <section class="panel">
      <div class="panel-head"><div><h2 class="panel-title">Comparison</h2><p class="panel-sub">Sorted by delivered price</p></div></div>
      <table class="table">
        <thead><tr><th>Supplier</th><th>Rate</th><th>ETA</th><th>Rating</th></tr></thead>
        <tbody>${quotes.map(q => `<tr><td><strong>${q.name}</strong><div class="panel-sub">${q.city}</div></td><td>${money(q.price)}</td><td>${q.eta}</td><td>★ ${q.rating.toFixed(1)}</td></tr>`).join('')}</tbody>
      </table>
    </section>
    <section class="grid-2">${quotes.map(supplierCard).join('')}</section>
  `;
};

const homePage = () => `
  ${hero('Construction supply, instantly compared.', 'SiteSupply turns construction procurement into a workspace: compare suppliers, request quotes, track projects, and keep operations moving.', `
    <button class="button primary" data-route="dashboard">Open dashboard</button>
    <button class="button secondary" data-route="projects">Review projects</button>
  `)}
  ${statGrid(METRICS)}
  <section class="grid-2">
    <div class="panel">
      <div class="panel-head"><div><h2 class="panel-title">Featured suppliers</h2><p class="panel-sub">High-coverage vendors across Ontario and nearby US corridors.</p></div></div>
      <div class="card-list">${SUPPLIERS.slice(0,4).map(supplierCard).join('')}</div>
    </div>
    <div class="panel">
      <div class="panel-head"><div><h2 class="panel-title">Recent projects</h2><p class="panel-sub">Operational activity and quote status.</p></div></div>
      <div class="card-list">${PROJECTS.slice(0,3).map(projectCard).join('')}</div>
    </div>
  </section>
  <section class="panel">
    <div class="panel-head"><div><h2 class="panel-title">Supplier map</h2><p class="panel-sub">Live network view for the current corridor.</p></div></div>
    <div id="map" class="map"></div>
  </section>
`;

const dashboardPage = () => `
  ${hero('Operations dashboard', 'A focused command center for procurement, delivery, and supplier performance.', `
    <button class="button primary" data-route="projects">Compare projects</button>
    <button class="button secondary" data-route="messages">Review messages</button>
  `)}
  <section class="kpi-strip">${METRICS.map(m => `<div class="kpi"><div class="name">${m.label}</div><div class="num">${m.value}</div><div class="meta">${m.hint}</div></div>`).join('')}</section>
  <section class="grid-2">
    <div class="panel">
      <div class="panel-head"><div><h2 class="panel-title">Priority activity</h2><p class="panel-sub">What needs attention now.</p></div></div>
      <div class="inspector-list">${MESSAGES.map(m => `<div class="inspector-item"><div><strong>${m.subject}</strong><span>${m.preview}</span></div><span class="tag">${m.time}</span></div>`).join('')}</div>
    </div>
    <div class="panel">
      <div class="panel-head"><div><h2 class="panel-title">Current project</h2><p class="panel-sub">The workspace stays centered on one active project.</p></div></div>
      ${projectCard(selectedProject())}
      <div class="notice" style="margin-top:.75rem">Use project context to compare quotes, reopen supplier conversations, and track changes without leaving the workspace.</div>
    </div>
  </section>
`;

const projectsPage = () => {
  const p = selectedProject();
  return `
    ${hero('Projects workspace', 'Every project keeps quotes, suppliers, documents, and activity in one place.', `
      <button class="button primary" data-route="suppliers">Add supplier</button>
      <button class="button secondary" data-route="aggregates">Request quote</button>
    `)}
    <section class="grid-2">
      <div class="panel">
        <div class="panel-head"><div><h2 class="panel-title">Project list</h2><p class="panel-sub">Click a card to change the workspace focus.</p></div></div>
        <div class="card-list">${PROJECTS.map(projectCard).join('')}</div>
      </div>
      <div class="panel">
        <div class="panel-head"><div><h2 class="panel-title">Selected project</h2><p class="panel-sub">${p.name}</p></div></div>
        <div class="stat"><div class="label">Status</div><div class="value">${p.stage}</div><div class="hint">${p.location}</div></div>
        <div class="grid-2" style="margin-top:.8rem">
          <div class="stat"><div class="label">Budget</div><div class="value">${p.budget}</div><div class="hint">Live target</div></div>
          <div class="stat"><div class="label">Suppliers</div><div class="value">${p.supplierCount}</div><div class="hint">In comparison</div></div>
        </div>
        <div class="card-actions" style="margin-top:.8rem">${p.categories.map(c => `<span class="tag">${CATEGORIES[c].name}</span>`).join('')}</div>
      </div>
    </section>
  `;
};

const suppliersPage = () => {
  const filtered = SUPPLIERS.filter(s => {
    const matchesQuery = !state.query || `${s.name} ${s.city} ${s.tags.join(' ')}`.toLowerCase().includes(state.query.toLowerCase());
    const matchesCountry = state.country === 'ALL' || s.country === state.country;
    const matchesCategory = state.activeCategory === 'all' || s.categories.includes(state.activeCategory);
    return matchesQuery && matchesCountry && matchesCategory;
  });
  const featured = filtered.find(s => s.id === state.selectedSupplier) || filtered[0] || SUPPLIERS[0];
  return `
    ${hero('Supplier directory', 'Filter the network by category, country, and search term. The map and cards stay synchronized.', `
      <button class="button primary" data-route="home">Back to home</button>
      <button class="button secondary" data-route="dashboard">Dashboard</button>
    `)}
    <section class="toolbar">
      <input class="input" data-search-input placeholder="Search suppliers, city, or tag" value="${state.query}" />
      <select class="select" data-country-filter style="max-width:180px">
        ${['ALL', 'CA', 'US'].map(c => `<option ${state.country === c ? 'selected' : ''}>${c}</option>`).join('')}
      </select>
      <div class="toolbar" style="padding:.3rem; box-shadow:none; border:0; margin-left:auto">
        <button class="button ${state.activeCategory === 'all' ? 'primary' : 'secondary'} small" data-filter-category="all">All</button>
        <button class="button ${state.activeCategory === 'aggregates' ? 'primary' : 'secondary'} small" data-filter-category="aggregates">Aggregates</button>
        <button class="button ${state.activeCategory === 'rental' ? 'primary' : 'secondary'} small" data-filter-category="rental">Rental</button>
        <button class="button ${state.activeCategory === 'freight' ? 'primary' : 'secondary'} small" data-filter-category="freight">Freight</button>
      </div>
    </section>
    <section class="grid-2">
      <div class="panel">
        <div class="panel-head"><div><h2 class="panel-title">Results</h2><p class="panel-sub">${filtered.length} suppliers matched</p></div></div>
        <div class="card-list">${filtered.map(supplierCard).join('') || '<div class="empty">No suppliers match the current filters.</div>'}</div>
      </div>
      <div class="panel">
        <div class="panel-head"><div><h2 class="panel-title">Selected supplier</h2><p class="panel-sub">Network detail view</p></div></div>
        ${featured ? `
          <div class="card">
            <div class="card-row"><div><h3>${featured.name}</h3><p>${featured.city}</p></div><span class="badge">★ ${featured.rating.toFixed(1)}</span></div>
            <div class="card-actions">${featured.categories.map(c => `<span class="tag">${CATEGORIES[c].name}</span>`).join('')} ${featured.tags.map(t => `<span class="tag">${t}</span>`).join('')}</div>
          </div>
        ` : '<div class="empty">Select a supplier to see details.</div>'}
        <div id="map" class="map" style="margin-top:.8rem"></div>
      </div>
    </section>
  `;
};

const messagesPage = () => `
  ${hero('Messages', 'Track supplier replies and keep quote conversations tied to the project.', `
    <button class="button primary" data-route="projects">Open projects</button>
    <button class="button secondary" data-route="suppliers">Open suppliers</button>
  `)}
  <section class="grid-2">
    <div class="panel">
      <div class="panel-head"><div><h2 class="panel-title">Inbox</h2><p class="panel-sub">Recent supplier and project updates.</p></div></div>
      <div class="card-list">${MESSAGES.map(m => `<div class="card"><div class="card-row"><div><h3>${m.subject}</h3><p>${m.from}</p></div><span class="tag">${m.time}</span></div><p>${m.preview}</p></div>`).join('')}</div>
    </div>
    <div class="panel">
      <div class="panel-head"><div><h2 class="panel-title">Current thread</h2><p class="panel-sub">Keeps the work inside the workspace.</p></div></div>
      <div class="card"><h3>${MESSAGES[0].subject}</h3><p>${MESSAGES[0].preview}</p><div class="card-actions"><button class="button primary small">Open comparison</button><button class="button secondary small">Request revision</button></div></div>
      <div class="notice" style="margin-top:.75rem">Every reply should drive a next action: compare, approve, or request a revised quote.</div>
    </div>
  </section>
`;

const portalPage = () => `
  ${hero('Supplier portal', 'A lightweight workspace for lead response, quote intake, and status tracking.', `
    <button class="button primary" data-route="dashboard">Dashboard</button>
    <button class="button secondary" data-route="messages">Message center</button>
  `)}
  <section class="grid-2">
    <div class="panel">
      <div class="panel-head"><div><h2 class="panel-title">Active leads</h2><p class="panel-sub">Supplier-facing queue</p></div></div>
      <div class="card-list">${PORTAL_LEADS.map(lead => `
        <div class="card">
          <div class="card-row"><div><h3>${lead.title}</h3><p>${lead.note}</p></div><span class="chip">${lead.status}</span></div>
          <div class="card-actions"><span class="tag">Priority: ${lead.priority}</span><span class="tag">RFQ ready</span></div>
        </div>`).join('')}</div>
    </div>
    <div class="panel">
      <div class="panel-head"><div><h2 class="panel-title">Supplier view</h2><p class="panel-sub">A buyer can flip into this view without leaving the app.</p></div></div>
      <div class="stat"><div class="label">Today</div><div class="value">6 leads</div><div class="hint">2 responses pending</div></div>
      <div class="grid-2" style="margin-top:.8rem">
        <div class="stat"><div class="label">Open RFQs</div><div class="value">14</div><div class="hint">Across active regions</div></div>
        <div class="stat"><div class="label">Reply SLA</div><div class="value">2h</div><div class="hint">Median response time</div></div>
      </div>
      <div class="notice" style="margin-top:.75rem">Suppliers need a fast queue, response status, and direct quote submission. This keeps that flow tight.</div>
    </div>
  </section>
`;

const inspector = () => {
  const project = selectedProject();
  const supplier = selectedSupplier();
  return `
    <div class="panel">
      <div class="panel-head"><div><h2 class="panel-title">Workspace</h2><p class="panel-sub">Context stays attached to the current route.</p></div></div>
      <div class="inspector-list">
        <div class="inspector-item"><div><strong>Active route</strong><span>${state.route}</span></div><span class="tag">Live</span></div>
        <div class="inspector-item"><div><strong>Currency</strong><span>${state.currency}</span></div><span class="tag">Toggle</span></div>
        <div class="inspector-item"><div><strong>Project</strong><span>${project.name}</span></div><span class="tag">${project.stage}</span></div>
        <div class="inspector-item"><div><strong>Supplier</strong><span>${supplier.name}</span></div><span class="tag">★ ${supplier.rating.toFixed(1)}</span></div>
      </div>
    </div>
    <div class="panel">
      <div class="panel-head"><div><h2 class="panel-title">Next actions</h2><p class="panel-sub">Keep the workflow inside the app.</p></div></div>
      <div class="inspector-list">
        <div class="inspector-item"><div><strong>Compare quotes</strong><span>Open the most relevant category for the project.</span></div><button class="button secondary small" data-route="aggregates">Open</button></div>
        <div class="inspector-item"><div><strong>Review suppliers</strong><span>Filter by network coverage and performance.</span></div><button class="button secondary small" data-route="suppliers">Open</button></div>
        <div class="inspector-item"><div><strong>Check messages</strong><span>Track quote responses and revisions.</span></div><button class="button secondary small" data-route="messages">Open</button></div>
      </div>
    </div>
  `;
};

const routeContent = () => {
  switch (state.route) {
    case 'aggregates': return categoryPage(CATEGORIES.aggregates);
    case 'rental': return categoryPage(CATEGORIES.rental);
    case 'freight': return categoryPage(CATEGORIES.freight);
    case 'projects': return projectsPage();
    case 'suppliers': return suppliersPage();
    case 'messages': return messagesPage();
    case 'supplier-portal': return portalPage();
    case 'dashboard': return dashboardPage();
    default: return homePage();
  }
};

const buildShell = () => `
  <div class="app-shell">
    <header class="topbar">
      <div class="topbar-inner">
        <a class="brand" href="#" data-route="home">
          <div class="brand-mark">SS</div>
          <div class="brand-copy"><strong>SiteSupply</strong><span>Quote workspace</span></div>
        </a>
        <nav class="nav">${NAV_ITEMS.map(navLink).join('')}</nav>
        <div class="topbar-actions">
          <button class="pill" data-route="dashboard">Dashboard</button>
          <button class="pill primary" data-route="projects">Projects</button>
        </div>
      </div>
    </header>
    <main class="workspace">
      <section class="content">${routeContent()}</section>
      <aside class="inspector">${inspector()}</aside>
    </main>
    <nav class="mobile-nav"><div class="mobile-nav-inner">${NAV_ITEMS.slice(0,6).map(mobileLink).join('')}</div></nav>
  </div>`;

const renderMap = suppliers => {
  const el = document.getElementById('map');
  if (!el || !window.L) return;
  if (mapInstance) { mapInstance.remove(); mapInstance = null; }
  mapInstance = window.L.map(el, { zoomControl: true, scrollWheelZoom: false }).setView([43.85, -79.3], 7);
  window.L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
    attribution: '&copy; OpenStreetMap &copy; CARTO'
  }).addTo(mapInstance);
  const markers = suppliers.map(s => {
    const marker = window.L.marker(s.coords).addTo(mapInstance).bindPopup(`<strong>${s.name}</strong><br>${s.city}<br>★ ${s.rating.toFixed(1)}`);
    window.L.circle(s.coords, { radius: 45000, color: '#F45B1A', fillOpacity: .05, weight: 1 }).addTo(mapInstance);
    return marker;
  });
  if (markers.length) {
    const group = window.L.featureGroup(markers);
    mapInstance.fitBounds(group.getBounds().pad(0.15));
  }
};

const bindInteractions = () => {
  app.onclick = event => {
    const routeBtn = event.target.closest('[data-route]');
    if (routeBtn) {
      event.preventDefault();
      setRoute(routeBtn.dataset.route);
      return;
    }
    const currencyBtn = event.target.closest('[data-currency]');
    if (currencyBtn) {
      setCurrency(currencyBtn.dataset.currency);
      return;
    }
    const roleBtn = event.target.closest('[data-role-switch]');
    if (roleBtn) {
      setRole(state.role === 'buyer' ? 'supplier' : 'buyer');
      return;
    }
    const projectCardEl = event.target.closest('[data-project]');
    if (projectCardEl) {
      state.selectedProject = projectCardEl.dataset.project;
      render();
      return;
    }
    const supplierCardEl = event.target.closest('[data-supplier]');
    if (supplierCardEl) {
      state.selectedSupplier = supplierCardEl.dataset.supplier;
      render();
      return;
    }
    const categoryBtn = event.target.closest('[data-filter-category]');
    if (categoryBtn) {
      state.activeCategory = categoryBtn.dataset.filterCategory;
      render();
      return;
    }
  };

  app.oninput = event => {
    if (event.target.matches('[data-search-input]')) {
      state.query = event.target.value;
      render();
    }
    if (event.target.matches('[data-country-filter]')) {
      state.country = event.target.value;
      render();
    }
  };

  app.onsubmit = event => {
    const form = event.target.closest('[data-quote-form]');
    if (!form) return;
    event.preventDefault();
    const category = form.dataset.quoteForm;
    state.quoteInputs[category] = Object.fromEntries(new FormData(form).entries());
    render();
  };
};

function render() {
  app.innerHTML = buildShell();
  const needsMap = ['home', 'suppliers'].includes(state.route) || ['aggregates', 'rental', 'freight'].includes(state.route);
  renderMap(needsMap ? getMapSuppliers() : []);
}

function getMapSuppliers() {
  if (state.route === 'suppliers') {
    return SUPPLIERS.filter(s => {
      const matchesQuery = !state.query || `${s.name} ${s.city} ${s.tags.join(' ')}`.toLowerCase().includes(state.query.toLowerCase());
      const matchesCountry = state.country === 'ALL' || s.country === state.country;
      const matchesCategory = state.activeCategory === 'all' || state.activeCategory === 'home' || s.categories.includes(state.activeCategory);
      return matchesQuery && matchesCountry && matchesCategory;
    });
  }
  if (state.route === 'home') return SUPPLIERS.slice(0, 8);
  return SUPPLIERS.filter(s => s.categories.includes(state.route)).slice(0, 6);
}

bindInteractions();
render();
if (!window.L) {
  window.addEventListener('load', () => render(), { once: true });
}
