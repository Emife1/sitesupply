import { CATEGORIES, NAV_ITEMS } from './data.js';
import { store, selectors, routeTo, syncRoute, markRecent } from './store.js';
import { projectService, supplierService, quoteService, searchService, dashboardService, money } from './services.js';
import { hero, metricStrip, navButton, mobileButton, panel, cardList, supplierCard, projectCard, messageCard, leadCard, quoteTable, commandOverlay, escapeHtml } from './components.js';

const app = document.getElementById('app');
let mapInstance = null;
let mapMarkerLayer = null;
let queryRenderTimer = null;
let lastRenderedRoute = null;

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
const setQuery = (query, { defer = false } = {}) => {
  if (!defer) return store.setState({ query });
  store.setState({ query }, { notify: false });
  window.clearTimeout(queryRenderTimer);
  queryRenderTimer = window.setTimeout(render, 120);
};
const setCountry = country => store.setState({ country });
const setSelectedProject = id => {
  const shouldOpen = state().route !== 'projects';
  store.setState({ selectedProject: id, ...(shouldOpen ? { route: 'projects', commandOpen: false } : {}) });
  if (shouldOpen) routeTo('projects');
  markRecent('project', id, projectService.get(id)?.name || id);
};
const setSelectedSupplier = id => {
  const shouldOpen = state().route !== 'suppliers';
  store.setState({ selectedSupplier: id, ...(shouldOpen ? { route: 'suppliers', commandOpen: false } : {}) });
  if (shouldOpen) routeTo('suppliers');
  markRecent('supplier', id, supplierService.get(id)?.name || id);
};
const toggleCommand = open => store.setState({ commandOpen: typeof open === 'boolean' ? open : !state().commandOpen });

function updateQuoteInput(categoryId, fieldId, value) {
  const current = state();
  const quoteInputs = {
    ...current.quoteInputs,
    [categoryId]: { ...(current.quoteInputs[categoryId] || {}), [fieldId]: value }
  };
  store.setState({ quoteInputs }, { notify: false });
}

function buildShell(content, inspector) {
  const s = state();
  const nav = NAV_ITEMS.map((item, index) => navButton(item, s.route === item.id, index)).join('');
  const mobile = NAV_ITEMS.map((item, index) => mobileButton(item, s.route === item.id, index)).join('');
  return `
    <div class="app-shell">
      <aside class="shell-sidebar">
        <a class="brand-block" href="/" aria-label="Return to SiteSupply public site">
          <img class="brand-mark" src="/assets/logo.svg" alt="">
          <span>
            <span class="brand-name">SiteSupply</span>
            <span class="brand-sub">Construction sourcing, simplified</span>
          </span>
        </a>
        <div class="sidebar-section">
          <div class="sidebar-label">Navigate</div>
          <div class="sidebar-nav">${nav}</div>
        </div>
        <div class="sidebar-section">
          <div class="sidebar-label">Context</div>
          <div class="context-panel">
            <button class="context-action" type="button" data-route="projects"><span>Active project</span><strong>${escapeHtml(activeProject()?.name || '—')}</strong><em>Open project workspace</em></button>
            <button class="context-action" type="button" data-route="suppliers"><span>Selected supplier</span><strong>${escapeHtml(activeSupplier()?.name || '—')}</strong><em>Review supplier details</em></button>
            <button class="context-action" type="button" data-role-switch><span>Workspace mode</span><strong>${escapeHtml(s.role === 'buyer' ? 'Buyer view' : 'Supplier view')}</strong><em>Switch workspace mode</em></button>
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
            <div class="topbar-kicker">SiteSupply project workspace</div>
            <div class="topbar-title">${escapeHtml(titleForRoute(s.route))}</div>
          </div>
          <div class="topbar-actions">
            <div class="control-group" role="group" aria-label="Display currency"><span class="control-label">Currency</span><button class="pill ${s.currency === 'CAD' ? 'primary' : ''}" data-currency="CAD" aria-pressed="${s.currency === 'CAD'}">CAD</button><button class="pill ${s.currency === 'USD' ? 'primary' : ''}" data-currency="USD" aria-pressed="${s.currency === 'USD'}">USD</button></div>
            <button class="pill role-control" data-role-switch aria-label="Switch between buyer and supplier workspace">${s.role === 'buyer' ? 'Buyer view' : 'Supplier view'}<span aria-hidden="true">↔</span></button>
          </div>
        </header>
        <div class="shell-toolbar">
          <div class="search-block">
            <span class="search-label">Search workspace</span>
            <button type="button" class="search-trigger" data-command-open aria-haspopup="dialog" aria-label="Search projects, suppliers, messages, and commands">
              <span><strong>${s.query ? escapeHtml(s.query) : 'Projects, suppliers, messages, commands'}</strong><small>Open workspace search</small></span>
              <kbd>⌘K</kbd>
            </button>
          </div>
          <div class="toolbar-filter" role="group" aria-label="Supplier region"><span class="control-label">Supplier region</span><div class="toolbar-chips">
            <button class="pill ${s.country === 'ALL' ? 'primary' : ''}" data-country="ALL" aria-pressed="${s.country === 'ALL'}">All regions</button>
            <button class="pill ${s.country === 'CA' ? 'primary' : ''}" data-country="CA" aria-pressed="${s.country === 'CA'}">Canada</button>
            <button class="pill ${s.country === 'US' ? 'primary' : ''}" data-country="US" aria-pressed="${s.country === 'US'}">United States</button>
          </div></div>
        </div>
        <div class="shell-content"><div class="workspace-note"><div><span class="workspace-note-label">Ontario early access is live</span><strong>Project context stays attached</strong></div><p>Public intake is live. Planning values remain clearly labelled demonstrations until a participating supplier provides a real response.</p><a href="/compare">Start a real request <span aria-hidden="true">→</span></a></div>${content}</div>
      </main>
      <aside class="shell-inspector">
        ${inspector}
      </aside>
    </div>
    <nav class="mobile-nav">${mobile}</nav>
    ${s.commandOpen ? commandOverlay({ open: true, query: s.query, results: searchService.search(s.query) }) : ''}
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
        <label class="field select-field">
          <span>${escapeHtml(field.label)}</span>
          <select data-quote-input="${field.id}" data-quote-category="${categoryId}">
            ${field.options.map(option => `<option ${String(values[field.id] ?? field.value ?? '') === option ? 'selected' : ''}>${escapeHtml(option)}</option>`).join('')}
          </select>
        </label>` : `
        <label class="field">
          <span>${escapeHtml(field.label)}</span>
          <input data-quote-input="${field.id}" data-quote-category="${categoryId}" type="${field.type}" min="${field.min ?? ''}" placeholder="${escapeHtml(field.placeholder || '')}" value="${escapeHtml(values[field.id] ?? field.value ?? '')}" />
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
    ${hero({ kicker: 'Project sourcing', title: 'Your sourcing work,', accent: 'organized properly.', subtitle: 'Keep project requirements, supplier options, quote planning, and activity attached to the same context.', actions: `<button class="button primary" data-route="dashboard">Open dashboard</button><button class="button secondary" data-route="projects">Open project workspace</button>` })}
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
    ${hero({ kicker: category.name, title: `Prepare ${category.name.toLowerCase()} requests,`, accent: 'with the context attached.', subtitle: 'Set out the requirement clearly, review planning options, and keep supplier-issued pricing separate from demonstration values.', actions: `<button class="button primary" data-route="projects">Back to project workspace</button><button class="button secondary" data-route="suppliers">Browse suppliers</button>` })}
    <section class="grid-2">
      ${panel('Request parameters', category.description, formForCategory(categoryId))}
      ${panel('Quote comparison', 'Demonstration planning estimates only. Supplier-issued quotes replace these values in production.', quoteTable(quotes))}
    </section>
    <section class="grid-2">
      ${panel('Matched suppliers', 'Filtered to this category and current scope.', cardList(suppliers.map(s => supplierCard(s, s.id === state().selectedSupplier)).join('')))}
      ${panel('Recommendation', 'Demonstration fit ordering for the workspace prototype.', `<div class="inspector-list">${quotes.slice(0, 3).map(q => `<div class="inspector-item"><div><strong>${escapeHtml(q.supplier.name)}</strong><span>${escapeHtml(q.notes.join(' · '))}</span></div><span class="tag">${escapeHtml(q.total)}</span></div>`).join('')}</div>`)}
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
    ${hero({ kicker: 'Project workspace', title: 'Keep every requirement', accent: 'with its project.', subtitle: 'Quotes, suppliers, deliveries, and documents remain attached to the project that created them.', actions: `<button class="button primary" data-route="dashboard">Back to dashboard</button><button class="button secondary" data-route="messages">Open messages</button>` })}
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
    ${hero({ kicker: 'Supplier directory', title: 'Supplier coverage,', accent: 'without losing context.', subtitle: 'Review categories, service areas, and current project fit in one clear working view.', actions: `<button class="button primary" data-route="dashboard">Back to dashboard</button><button class="button secondary" data-route="projects">Open projects</button>` })}
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
    ${hero({ kicker: 'Messages', title: 'Keep every conversation', accent: 'with the work.', subtitle: 'Project and supplier communication stays visible without becoming a disconnected inbox.', actions: `<button class="button primary" data-route="dashboard">Back to dashboard</button>` })}
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
    ${hero({ kicker: 'Supplier portal', title: 'Inbound opportunities,', accent: 'properly prepared.', subtitle: 'Review project demand with the context required for a useful supplier response.', actions: `<button class="button primary" data-route="dashboard">Buyer view</button>` })}
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
    ${hero({ kicker: 'Operations overview', title: 'A clear view of', accent: 'what needs attention.', subtitle: 'See projects, requests, supplier activity, and planning values without turning the workspace into a wall of widgets.', actions: `<button class="button primary" data-route="projects">Open projects</button><button class="button secondary" data-route="aggregates">Compare quotes</button>` })}
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
  if (route === 'home') return renderHome();
  if (route === 'dashboard') return renderDashboard();
  if (route === 'projects') return renderProjects();
  if (route === 'suppliers') return renderSuppliers();
  if (route === 'messages') return renderMessages();
  if (route === 'supplier-portal') return renderPortal();
  if (CATEGORIES[route]) return renderCategory(route);
  return renderHome();
}

function render() {
  if (!app) return;
  const active = document.activeElement;
  const commandFocused = active?.matches?.('[data-command-input]');
  const selectionStart = commandFocused ? active.selectionStart : null;
  const selectionEnd = commandFocused ? active.selectionEnd : null;
  if (mapInstance) { try { mapInstance.remove(); } catch {} mapInstance = null; mapMarkerLayer = null; }
  app.innerHTML = renderByRoute();
  if (state().commandOpen) {
    requestAnimationFrame(() => {
      const next = app.querySelector('[data-command-input]');
      if (!next) return;
      next.focus({ preventScroll: true });
      if (typeof selectionStart === 'number' && typeof next.setSelectionRange === 'function') {
        next.setSelectionRange(selectionStart, selectionEnd);
      } else if (typeof next.setSelectionRange === 'function') {
        next.setSelectionRange(next.value.length, next.value.length);
      }
    });
  }
  const renderedRoute = state().route;
  if (renderedRoute !== lastRenderedRoute) {
    lastRenderedRoute = renderedRoute;
    requestAnimationFrame(() => {
      const mobileNav = app.querySelector('.mobile-nav');
      const activeLink = mobileNav?.querySelector('.mobile-link.active');
      if (!mobileNav || !activeLink || window.matchMedia('(min-width: 901px)').matches) return;
      const left = activeLink.offsetLeft - ((mobileNav.clientWidth - activeLink.clientWidth) / 2);
      mobileNav.scrollTo({ left: Math.max(0, left), behavior: 'smooth' });
    });
  }
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
    window.L.circle(s.coords, { radius: 50000, color: '#E65A2B', fillColor: '#E65A2B', fillOpacity: 0.06, weight: 1 }).addTo(mapInstance);
  });
  try {
    mapInstance.fitBounds(window.L.featureGroup(points).getBounds().pad(0.1));
  } catch {}
}

function buildCommandResults() {
  return searchService.search(state().query);
}

app.addEventListener('click', event => {
  const target = event.target.closest('[data-route],[data-currency],[data-country],[data-role-switch],[data-project],[data-supplier],[data-command-open],[data-command-close],[data-command-backdrop],[data-reset-category],[data-pin]');
  if (!target) return;
  if (target.hasAttribute('data-command-backdrop')) {
    if (event.target === target) toggleCommand(false);
    return;
  }
  if (target.dataset.route) return setRoute(target.dataset.route);
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
  if (target.matches('[data-command-input]')) return setQuery(target.value, { defer: true });
  if (target.matches('[data-country]')) return setCountry(target.value);
  if (target.matches('input[data-quote-input]')) return updateQuoteInput(target.dataset.quoteCategory, target.dataset.quoteInput, target.value);
});

app.addEventListener('change', event => {
  const target = event.target;
  if (target.matches('select[data-quote-input]')) {
    updateQuoteInput(target.dataset.quoteCategory, target.dataset.quoteInput, target.value);
  }
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
