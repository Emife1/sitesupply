import { CATEGORIES, NAV_ITEMS } from './data.js';
import { store, selectors, routeTo, syncRoute, markRecent } from './store.js';
import { projectService, supplierService, quoteService, searchService, dashboardService, money } from './services.js';
import { hero, metricStrip, navButton, mobileButton, panel, cardList, supplierCard, projectCard, messageCard, leadCard, quoteTable, commandOverlay, escapeHtml } from './components.js';

const app = document.getElementById('app');
let mapInstance = null;
let mapMarkerLayer = null;

const state = () => store.getState();
const currentCategory = () => CATEGORIES[state().activeCategory] || CATEGORIES.aggregates;
const activeProject = () => selectors.activeProject(state());
const activeSupplier = () => selectors.activeSupplier(state());

const syncUrl = () => {
  const hash = window.location.hash.replace(/^#\/?/, '');
  if (!hash) return;
  const route = hash.split('/')[0] || 'home';
  if (route && route !== state().route) store.setState({ route });
};

const setRoute = route => {
  routeTo(route);
  store.setState({ route, commandOpen: false });
  markRecent('route', route, route);
};

const setCurrency = currency => store.setState({ currency });
const toggleRole = () => {
  const next = state().role === 'buyer' ? 'supplier' : 'buyer';
  store.setState({ role: next, route: next === 'supplier' ? 'supplier-portal' : 'home' });
  routeTo(next === 'supplier' ? 'supplier-portal' : 'home');
};
const setCategory = categoryId => store.setState({ activeCategory: categoryId, route: categoryId });
const setQuery = query => store.setState({ query });
const setCountry = country => store.setState({ country });
const setSelectedProject = id => {
  store.setState({ selectedProject: id });
  markRecent('project', id, projectService.get(id)?.name || id);
};
const setSelectedSupplier = id => {
  store.setState({ selectedSupplier: id });
  markRecent('supplier', id, supplierService.get(id)?.name || id);
};
const toggleCommand = open => store.setState({ commandOpen: typeof open === 'boolean' ? open : !state().commandOpen });

function updateQuoteInput(categoryId, fieldId, value) {
  store.patch(current => {
    const quoteInputs = { ...current.quoteInputs, [categoryId]: { ...(current.quoteInputs[categoryId] || {}), [fieldId]: value } };
    return { ...current, quoteInputs };
  });
}

function buildShell(content, inspector) {
  const s = state();
  const nav = NAV_ITEMS.map(item => navButton(item, s.route === item.id)).join('');
  const mobile = NAV_ITEMS.slice(0, 5).map(item => mobileButton(item, s.route === item.id)).join('');
  return `
    <div class="app-shell">
      <aside class="shell-sidebar">
        <div class="brand-block">
          <div class="brand-mark">SS</div>
          <div>
            <div class="brand-name">SiteSupply</div>
            <div class="brand-sub">Workspace procurement OS</div>
          </div>
        </div>
        <div class="sidebar-section">
          <div class="sidebar-label">Navigate</div>
          <div class="sidebar-nav">${nav}</div>
        </div>
        <div class="sidebar-section">
          <div class="sidebar-label">Context</div>
          <div class="context-panel">
            <div><span>Project</span><strong>${escapeHtml(activeProject()?.name || '—')}</strong></div>
            <div><span>Supplier</span><strong>${escapeHtml(activeSupplier()?.name || '—')}</strong></div>
            <div><span>Mode</span><strong>${escapeHtml(s.role)}</strong></div>
          </div>
        </div>
        <div class="sidebar-section sidebar-footer">
          <button class="button primary full" data-command-open>Search ⌘K</button>
          <button class="button secondary full" data-role-switch>${s.role === 'buyer' ? 'Buyer view' : 'Supplier view'}</button>
        </div>
      </aside>
      <main class="shell-main">
        <header class="shell-topbar">
          <div>
            <div class="topbar-kicker">Industrial precision · digital trust</div>
            <div class="topbar-title">${escapeHtml(titleForRoute(s.route))}</div>
          </div>
          <div class="topbar-actions">
            <button class="pill ${s.currency === 'CAD' ? 'primary' : ''}" data-currency="CAD">CAD</button>
            <button class="pill ${s.currency === 'USD' ? 'primary' : ''}" data-currency="USD">USD</button>
            <button class="pill accent" data-role-switch>${s.role === 'buyer' ? 'Buyer view' : 'Supplier view'}</button>
          </div>
        </header>
        <div class="shell-toolbar">
          <label class="search-inline" aria-label="Search SiteSupply">
            <span>Search</span>
            <input data-search value="${escapeHtml(s.query)}" placeholder="Projects, suppliers, messages, commands" />
          </label>
          <div class="toolbar-chips">
            <button class="pill ${s.country === 'ALL' ? 'primary' : ''}" data-country="ALL">All</button>
            <button class="pill ${s.country === 'CA' ? 'primary' : ''}" data-country="CA">Canada</button>
            <button class="pill ${s.country === 'US' ? 'primary' : ''}" data-country="US">US</button>
          </div>
        </div>
        <div class="shell-content">${content}</div>
      </main>
      <aside class="shell-inspector">
        ${inspector}
      </aside>
    </div>
    <nav class="mobile-nav">${mobile}</nav>
    ${commandOverlay({ open: s.commandOpen, query: s.query, results: searchService.search(s.query) })}
  `;
}

function titleForRoute(route) {
  const match = NAV_ITEMS.find(item => item.id === route);
  if (match) return match.label;
  return currentCategory().name || 'SiteSupply';
}

function formForCategory(categoryId) {
  const category = CATEGORIES[categoryId];
  const values = state().quoteInputs[categoryId] || {};
  return `
    <form class="quote-form" data-quote-form="${categoryId}">
      ${category.fields.map(field => field.type === 'select' ? `
        <label class="field">
          <span>${escapeHtml(field.label)}</span>
          <select data-quote-input="${field.id}" data-category="${categoryId}">
            ${field.options.map(option => `<option ${String(values[field.id] ?? field.value ?? '') === option ? 'selected' : ''}>${escapeHtml(option)}</option>`).join('')}
          </select>
        </label>` : `
        <label class="field">
          <span>${escapeHtml(field.label)}</span>
          <input data-quote-input="${field.id}" data-category="${categoryId}" type="${field.type}" min="${field.min ?? ''}" placeholder="${escapeHtml(field.placeholder || '')}" value="${escapeHtml(values[field.id] ?? field.value ?? '')}" />
        </label>`).join('')}
      <div class="quote-actions">
        <button class="button primary" type="submit">Compare quotes</button>
        <button class="button secondary" type="button" data-reset-category="${categoryId}">Reset</button>
      </div>
    </form>`;
}

function renderHome() {
  const metrics = dashboardService.metrics();
  const projectSummary = projectService.summary(state());
  const suppliers = supplierService.list(state()).slice(0, 4);
  const projects = projectService.list().slice(0, 3);
  const messages = dashboardService.messages().slice(0, 4);
  const content = `
    ${hero({ kicker: 'Workspace overview', title: 'Construction supply, instantly compared.', subtitle: 'One workspace for projects, suppliers, quotes, and live activity.', actions: `<button class="button primary" data-route="dashboard">Open dashboard</button><button class="button secondary" data-route="projects">Open project workspace</button>` })}
    ${metricStrip(metrics)}
    <section class="grid-2">
      ${panel('Priority activity', 'What needs attention now.', `<div class="inspector-list">${messages.map(messageCard).join('')}</div>`)}
      ${panel('Current project', 'The active workspace context.', `<div class="project-summary"><strong>${escapeHtml(projectSummary.current)}</strong><span>${escapeHtml(projectSummary.location)}</span><span>${escapeHtml(projectSummary.stage)}</span><span>${escapeHtml(projectSummary.budget)}</span></div><div class="notice">Use the project workspace to compare quotes and manage suppliers without losing context.</div>`)}
    </section>
    <section class="grid-2">
      ${panel('Featured suppliers', 'High-coverage vendors across Ontario and nearby US corridors.', cardList(suppliers.map(s => supplierCard(s, s.id === state().selectedSupplier)).join('')))}
      ${panel('Recent projects', 'Operational activity and quote status.', cardList(projects.map(p => projectCard(p, p.id === state().selectedProject, state().pinnedProjects.includes(p.id))).join('')))}
    </section>
    ${panel('Supplier map', 'Live network view for the current corridor.', '<div id="map" class="map"></div>')}
  `;
  const inspector = `
    <div class="inspector-block">
      <h3>Quick actions</h3>
      <button class="button secondary full" data-route="aggregates">Aggregates</button>
      <button class="button secondary full" data-route="rental">Rental</button>
      <button class="button secondary full" data-route="freight">Freight</button>
    </div>
    <div class="inspector-block">
      <h3>Recent items</h3>
      <div class="inspector-list">
        ${(state().recentItems.length ? state().recentItems : [{ label: 'No recent items yet', kind: 'hint', id: 'none' }]).map(item => `<div class="inspector-item"><div><strong>${escapeHtml(item.label)}</strong><span>${escapeHtml(item.kind)}</span></div><span class="tag">${escapeHtml(item.at ? new Date(item.at).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }) : '—')}</span></div>`).join('')}
      </div>
    </div>`;
  return buildShell(content, inspector);
}

function renderCategory(categoryId) {
  const category = CATEGORIES[categoryId];
  const quotes = quoteService.compare(categoryId, state().quoteInputs[categoryId] || {}, state().currency);
  const suppliers = supplierService.list({ ...state(), activeCategory: categoryId });
  const content = `
    ${hero({ kicker: category.name, title: `Compare ${category.name.toLowerCase()} quotes.`, subtitle: category.helper, actions: `<button class="button primary" data-route="projects">Back to project workspace</button><button class="button secondary" data-route="suppliers">Browse suppliers</button>` })}
    <section class="grid-2">
      ${panel('Request parameters', category.description, formForCategory(categoryId))}
      ${panel('Quote comparison', 'Ranked by estimated landed cost and serviceability.', quoteTable(quotes))}
    </section>
    <section class="grid-2">
      ${panel('Matched suppliers', 'Filtered to this category and current scope.', cardList(suppliers.map(s => supplierCard(s, s.id === state().selectedSupplier)).join('')))}
      ${panel('Recommendation', 'Best-fit supplier profiles for the current request.', `<div class="inspector-list">${quotes.slice(0, 3).map(q => `<div class="inspector-item"><div><strong>${escapeHtml(q.supplier.name)}</strong><span>${escapeHtml(q.notes.join(' · '))}</span></div><span class="tag">${escapeHtml(q.total)}</span></div>`).join('')}</div>`)}
    </section>
  `;
  const inspector = `
    <div class="inspector-block">
      <h3>Selection</h3>
      <div class="context-panel compact">
        <div><span>Category</span><strong>${escapeHtml(category.name)}</strong></div>
        <div><span>Currency</span><strong>${escapeHtml(state().currency)}</strong></div>
        <div><span>Matches</span><strong>${suppliers.length}</strong></div>
      </div>
    </div>
    <div class="inspector-block">
      <h3>Top quote</h3>
      <div class="notice">${escapeHtml(quotes[0]?.supplier.name || 'No quotes yet')} · ${escapeHtml(quotes[0]?.total || '—')}</div>
    </div>`;
  return buildShell(content, inspector);
}

function renderProjects() {
  const project = activeProject();
  const all = projectService.list();
  const content = `
    ${hero({ kicker: 'Project workspace', title: 'Everything stays centered on one active project.', subtitle: 'Quotes, suppliers, deliveries, and documents remain in context.', actions: `<button class="button primary" data-route="dashboard">Back to dashboard</button><button class="button secondary" data-route="messages">Open messages</button>` })}
    <section class="grid-2">
      ${panel('Active project', 'The current working context.', project ? `<div class="project-summary"><strong>${escapeHtml(project.name)}</strong><span>${escapeHtml(project.location)}</span><span>${escapeHtml(project.stage)}</span><span>${escapeHtml(project.budget)}</span></div><div class="notice">Pinned and recent projects are synced across sessions.</div>` : '<div class="empty">No project selected.</div>')}
      ${panel('Project list', 'Select another project without leaving the workspace.', cardList(all.map(p => projectCard(p, p.id === state().selectedProject, state().pinnedProjects.includes(p.id))).join('')))}
    </section>
    <section class="grid-2">
      ${panel('Timeline', 'Recent operational activity.', `<div class="inspector-list">${dashboardService.messages().map(messageCard).join('')}</div>`) }
      ${panel('Pinned projects', 'Quick access for repeat workflows.', `<div class="inspector-list">${state().pinnedProjects.map(id => projectService.get(id)).filter(Boolean).map(p => `<div class="inspector-item"><div><strong>${escapeHtml(p.name)}</strong><span>${escapeHtml(p.location)}</span></div><button class="pill" data-pin="${p.id}">Unpin</button></div>`).join('') || '<div class="empty">No pinned projects.</div>'}</div>`)}
    </section>
  `;
  const inspector = `
    <div class="inspector-block">
      <h3>Project actions</h3>
      <button class="button secondary full" data-route="aggregates">Request aggregates quote</button>
      <button class="button secondary full" data-route="rental">Request rental quote</button>
      <button class="button secondary full" data-route="freight">Request freight quote</button>
    </div>`;
  return buildShell(content, inspector);
}

function renderSuppliers() {
  const suppliers = supplierService.list(state());
  const active = activeSupplier();
  const content = `
    ${hero({ kicker: 'Supplier directory', title: 'Filter, compare, and select suppliers.', subtitle: 'Network coverage with pinned context and quick selection.', actions: `<button class="button primary" data-route="dashboard">Back to dashboard</button><button class="button secondary" data-route="projects">Open projects</button>` })}
    <section class="grid-2">
      ${panel('Supplier network', 'Live match results for the current filter set.', cardList(suppliers.map(s => supplierCard(s, s.id === state().selectedSupplier)).join('')))}
      ${panel('Selected supplier', 'Deep context for the current supplier.', active ? `<div class="context-stack"><div><strong>${escapeHtml(active.name)}</strong><span>${escapeHtml(active.city)}</span></div><div class="notice">${escapeHtml((active.tags || []).join(' · '))}</div><div class="project-summary"><span>Website</span><strong>${escapeHtml(active.website)}</strong><span>Phone</span><strong>${escapeHtml(active.phone)}</strong></div></div>` : '<div class="empty">No supplier selected.</div>')}
    </section>
    <section class="grid-2">
      ${panel('Map', 'Supplier positions remain synced with the network list.', '<div id="map" class="map"></div>')}
      ${panel('Recent selections', 'Your latest supplier interactions.', `<div class="inspector-list">${state().recentItems.filter(item => item.kind === 'supplier').map(item => `<div class="inspector-item"><div><strong>${escapeHtml(item.label)}</strong><span>${escapeHtml(item.id)}</span></div><span class="tag">recent</span></div>`).join('') || '<div class="empty">No recent supplier selections.</div>'}</div>`)}
    </section>
  `;
  const inspector = `
    <div class="inspector-block">
      <h3>Filter scope</h3>
      <div class="context-panel compact">
        <div><span>Category</span><strong>${escapeHtml(currentCategory().name)}</strong></div>
        <div><span>Country</span><strong>${escapeHtml(state().country)}</strong></div>
        <div><span>Matches</span><strong>${suppliers.length}</strong></div>
      </div>
    </div>`;
  return buildShell(content, inspector);
}

function renderMessages() {
  const messages = dashboardService.messages();
  const content = `
    ${hero({ kicker: 'Messages', title: 'Keep supplier communication in one lane.', subtitle: 'Activity is visible without leaving the workspace.', actions: `<button class="button primary" data-route="dashboard">Back to dashboard</button>` })}
    ${panel('Inbox', 'Operational updates and RFQ replies.', `<div class="inspector-list">${messages.map(messageCard).join('')}</div>`)}
  `;
  const inspector = `
    <div class="inspector-block">
      <h3>Message cues</h3>
      <div class="notice">Use the global search to jump directly into a supplier, project, or command.</div>
    </div>`;
  return buildShell(content, inspector);
}

function renderPortal() {
  const leads = dashboardService.leads();
  const content = `
    ${hero({ kicker: 'Supplier portal', title: 'Track inbound leads and work intake.', subtitle: 'A simple supplier-facing queue that can later connect to real auth.', actions: `<button class="button primary" data-route="dashboard">Buyer view</button>` })}
    ${panel('Lead queue', 'Pending opportunities and supplier activity.', `<div class="inspector-list">${leads.map(leadCard).join('')}</div>`) }
  `;
  const inspector = `
    <div class="inspector-block">
      <h3>Portal state</h3>
      <div class="context-panel compact">
        <div><span>Role</span><strong>${escapeHtml(state().role)}</strong></div>
        <div><span>Open leads</span><strong>${leads.length}</strong></div>
      </div>
    </div>`;
  return buildShell(content, inspector);
}

function renderDashboard() {
  const metrics = dashboardService.metrics();
  const active = activeProject();
  const content = `
    ${hero({ kicker: 'Operations dashboard', title: 'A focused command center for procurement.', subtitle: 'Track savings, quotes, and activity without leaving context.', actions: `<button class="button primary" data-route="projects">Open projects</button><button class="button secondary" data-route="aggregates">Compare quotes</button>` })}
    ${metricStrip(metrics)}
    <section class="grid-2">
      ${panel('Priority activity', 'What needs attention now.', `<div class="inspector-list">${dashboardService.messages().map(messageCard).join('')}</div>`)}
      ${panel('Current project', 'The workspace stays centered on one active project.', active ? projectCard(active, true, state().pinnedProjects.includes(active.id)) : '<div class="empty">No active project.</div>')}
    </section>
  `;
  const inspector = `
    <div class="inspector-block">
      <h3>Workspace status</h3>
      <div class="context-panel compact">
        <div><span>Route</span><strong>${escapeHtml(state().route)}</strong></div>
        <div><span>Currency</span><strong>${escapeHtml(state().currency)}</strong></div>
        <div><span>Recent</span><strong>${state().recentItems.length}</strong></div>
      </div>
    </div>`;
  return buildShell(content, inspector);
}

function renderByRoute() {
  const route = state().route;
  if (route === 'dashboard' || route === 'home') return renderDashboard();
  if (route === 'projects') return renderProjects();
  if (route === 'suppliers') return renderSuppliers();
  if (route === 'messages') return renderMessages();
  if (route === 'supplier-portal') return renderPortal();
  if (CATEGORIES[route]) return renderCategory(route);
  return renderHome();
}

function render() {
  app.innerHTML = renderByRoute();
  requestAnimationFrame(initMapIfNeeded);
}

function initMapIfNeeded() {
  const el = document.getElementById('map');
  if (!el || typeof window.L === 'undefined') return;
  if (mapInstance) {
    mapInstance.invalidateSize();
    return;
  }
  mapInstance = window.L.map(el).setView([43.95, -79.5], 7);
  window.L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', { attribution: '&copy; OSM' }).addTo(mapInstance);
  mapMarkerLayer = window.L.layerGroup().addTo(mapInstance);
  const suppliers = supplierService.list(state());
  const points = [];
  suppliers.forEach(s => {
    const marker = window.L.marker(s.coords).addTo(mapMarkerLayer).bindPopup(`<strong>${escapeHtml(s.name)}</strong><br>${escapeHtml(s.city)}<br>★ ${s.rating.toFixed(1)}`);
    points.push(marker);
    window.L.circle(s.coords, { radius: 50000, color: '#F45B1A', fillColor: '#F45B1A', fillOpacity: 0.06, weight: 1 }).addTo(mapInstance);
  });
  try {
    mapInstance.fitBounds(window.L.featureGroup(points).getBounds().pad(0.1));
  } catch {}
}

function buildCommandResults() {
  return searchService.search(state().query);
}

app.addEventListener('click', event => {
  const target = event.target.closest('[data-route],[data-category],[data-currency],[data-role-switch],[data-project],[data-supplier],[data-command-open],[data-command-close],[data-reset-category],[data-pin]');
  if (!target) return;
  if (target.dataset.route) return setRoute(target.dataset.route);
  if (target.dataset.category) return setCategory(target.dataset.category);
  if (target.dataset.currency) return setCurrency(target.dataset.currency);
  if (target.dataset.country) return setCountry(target.dataset.country);
  if (target.hasAttribute('data-role-switch')) return toggleRole();
  if (target.dataset.project) return setSelectedProject(target.dataset.project);
  if (target.dataset.supplier) return setSelectedSupplier(target.dataset.supplier);
  if (target.hasAttribute('data-command-open')) return toggleCommand(true);
  if (target.hasAttribute('data-command-close')) return toggleCommand(false);
  if (target.dataset.resetCategory) {
    const categoryId = target.dataset.resetCategory;
    const defaults = {
      aggregates: { material: '3/4" Clear Stone', quantity: 250, location: 'Mississauga, ON' },
      rental: { equipment: 'Mini Excavator', days: 5, location: 'Barrie, ON' },
      freight: { load: 'General freight', distance: 145, weight: 18 }
    };
    store.patch(current => ({ ...current, quoteInputs: { ...current.quoteInputs, [categoryId]: defaults[categoryId] } }));
    return;
  }
  if (target.dataset.pin) {
    const id = target.dataset.pin;
    store.patch(current => ({ ...current, pinnedProjects: current.pinnedProjects.includes(id) ? current.pinnedProjects.filter(p => p !== id) : [id, ...current.pinnedProjects].slice(0, 12) }));
  }
});

app.addEventListener('input', event => {
  const target = event.target;
  if (target.matches('[data-search]')) return setQuery(target.value);
  if (target.matches('[data-command-input]')) return setQuery(target.value);
  if (target.matches('[data-country]')) return setCountry(target.value);
  if (target.matches('[data-quote-input]')) return updateQuoteInput(target.dataset.category, target.dataset.quoteInput, target.value);
});

app.addEventListener('submit', event => {
  const form = event.target.closest('[data-quote-form]');
  if (!form) return;
  event.preventDefault();
  const categoryId = form.dataset.quoteForm;
  const inputs = state().quoteInputs[categoryId] || {};
  const quotes = quoteService.compare(categoryId, inputs, state().currency);
  const winner = quotes[0];
  if (winner) {
    markRecent('quote', winner.supplier.id, `${winner.supplier.name} · ${winner.total}`);
    store.setState({ selectedSupplier: winner.supplier.id });
  }
});

app.addEventListener('keydown', event => {
  const mod = event.metaKey || event.ctrlKey;
  if (mod && event.key.toLowerCase() === 'k') {
    event.preventDefault();
    toggleCommand(true);
    return;
  }
  if (event.key === 'Escape' && state().commandOpen) toggleCommand(false);
});

window.addEventListener('hashchange', syncRoute);
store.subscribe(render);
syncRoute();
render();
