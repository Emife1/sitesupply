import { CATEGORIES, NAV_ITEMS, SUPPLIERS, PROJECTS, MESSAGES, METRICS, PORTAL_LEADS } from './data.js';

export const STORAGE_KEY = 'sitesupply.workspace.v2';

export const DEFAULT_STATE = {
  route: 'home',
  currency: 'CAD',
  activeCategory: 'aggregates',
  query: '',
  country: 'ALL',
  quoteInputs: {
    aggregates: { material: '3/4" Clear Stone', quantity: 250, location: 'Mississauga, ON' },
    rental: { equipment: 'Mini Excavator', days: 5, location: 'Barrie, ON' },
    freight: { load: 'General freight', distance: 145, weight: 18 }
  },
  selectedProject: PROJECTS[0]?.id || null,
  selectedSupplier: SUPPLIERS[0]?.id || null,
  role: 'buyer',
  commandOpen: false,
  pinnedProjects: [PROJECTS[0]?.id].filter(Boolean),
  recentItems: [],
};

const listeners = new Set();

function safeParse(value) {
  try { return JSON.parse(value); } catch { return null; }
}

function mergeState(saved) {
  const next = structuredClone(DEFAULT_STATE);
  if (!saved || typeof saved !== 'object') return next;
  for (const [key, value] of Object.entries(saved)) {
    if (key === 'quoteInputs' && value && typeof value === 'object') {
      next.quoteInputs = { ...next.quoteInputs, ...value };
      continue;
    }
    if (key === 'recentItems' && Array.isArray(value)) {
      next.recentItems = value.slice(0, 12);
      continue;
    }
    if (key === 'pinnedProjects' && Array.isArray(value)) {
      next.pinnedProjects = value.slice(0, 12);
      continue;
    }
    if (key in next) next[key] = value;
  }
  return next;
}

function loadState() {
  if (typeof window === 'undefined') return structuredClone(DEFAULT_STATE);
  const raw = window.localStorage.getItem(STORAGE_KEY);
  return mergeState(raw ? safeParse(raw) : null);
}

let state = loadState();

function persist() {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

export const store = {
  getState() { return state; },
  setState(patch, { notify = true } = {}) {
    state = { ...state, ...patch };
    persist();
    if (notify) listeners.forEach(fn => fn(state));
  },
  patch(updater) {
    const next = updater(structuredClone(state));
    if (next && typeof next === 'object') {
      state = next;
      persist();
      listeners.forEach(fn => fn(state));
    }
  },
  subscribe(fn) {
    listeners.add(fn);
    return () => listeners.delete(fn);
  },
  reset() {
    state = structuredClone(DEFAULT_STATE);
    persist();
    listeners.forEach(fn => fn(state));
  }
};

export function routeTo(route) {
  const next = route.startsWith('#/') ? route : `#/${route.replace(/^#?\/?/, '')}`;
  if (window.location.hash !== next) window.location.hash = next;
}

export function syncRoute() {
  const raw = window.location.hash.replace(/^#\/?/, '').trim();
  const route = raw || 'home';
  store.setState({ route, commandOpen: false });
}

export function markRecent(kind, id, label) {
  const entry = { kind, id, label, at: new Date().toISOString() };
  store.patch(current => ({
    ...current,
    recentItems: [entry, ...current.recentItems.filter(item => !(item.kind === kind && item.id === id))].slice(0, 12)
  }));
}

export const selectors = {
  activeProject(state) { return PROJECTS.find(p => p.id === state.selectedProject) || PROJECTS[0] || null; },
  activeSupplier(state) { return SUPPLIERS.find(s => s.id === state.selectedSupplier) || SUPPLIERS[0] || null; },
  category(state) { return CATEGORIES[state.activeCategory] || CATEGORIES.aggregates; }
};
