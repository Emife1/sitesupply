import { CATEGORIES, SUPPLIERS, PROJECTS, MESSAGES, METRICS, PORTAL_LEADS, NAV_ITEMS } from './data.js';
import { selectors } from './store.js';

const RATE = 1.37;

export const money = (value, currency = 'CAD') => {
  const amount = currency === 'USD' ? value / RATE : value;
  return new Intl.NumberFormat('en-CA', { style: 'currency', currency, maximumFractionDigits: 0 }).format(amount);
};

export const projectService = {
  list() { return PROJECTS; },
  get(id) { return PROJECTS.find(p => p.id === id) || null; },
  summary(state) {
    const active = selectors.activeProject(state);
    return {
      current: active?.name || 'No active project',
      location: active?.location || '—',
      stage: active?.stage || '—',
      budget: active?.budget || '—'
    };
  }
};

export const supplierService = {
  list(state = {}) {
    const query = (state.query || '').trim().toLowerCase();
    const category = state.activeCategory;
    const country = state.country || 'ALL';
    return SUPPLIERS.filter(s => {
      const matchesCategory = category ? s.categories.includes(category) : true;
      const matchesCountry = country === 'ALL' ? true : s.country === country;
      const matchesQuery = !query || [s.name, s.city, s.website, ...(s.tags || [])].join(' ').toLowerCase().includes(query);
      return matchesCategory && matchesCountry && matchesQuery;
    });
  },
  get(id) { return SUPPLIERS.find(s => s.id === id) || null; }
};

export const quoteService = {
  compare(categoryId, inputs = {}, currency = 'CAD') {
    const categoryBias = { aggregates: 120, rental: 260, freight: 410 }[categoryId] || 150;
    const core = SUPPLIERS.filter(s => s.categories.includes(categoryId));
    const factor = {
      aggregates: Number(inputs.quantity || 250) * 0.15,
      rental: Number(inputs.days || 5) * 42,
      freight: Number(inputs.distance || 145) * 0.92 + Number(inputs.weight || 18) * 8
    }[categoryId] || 0;

    return core.map((supplier, index) => {
      const bias = supplier.country === 'US' ? 0.12 : 0;
      const score = Math.max(1, (5 - (supplier.rating - 4)) + index * 0.18 + bias * 10);
      const base = categoryBias + factor;
      const total = Math.round((base * score) / (1.04 + index * 0.03));
      const eta = categoryId === 'freight' ? `${Math.max(1, 2 + index)} days` : `${Math.max(1, 1 + Math.floor(index / 2))} days`;
      return {
        supplier,
        rate: total,
        total: money(total, currency),
        eta,
        confidence: Math.max(81, 96 - index * 3),
        notes: ['demo estimate', supplier.country === 'US' ? 'cross-border scenario' : 'regional scenario']
      };
    }).sort((a, b) => a.rate - b.rate);
  }
};

export const searchService = {
  search(term) {
    const q = (term || '').trim().toLowerCase();
    if (!q) return { projects: PROJECTS, suppliers: SUPPLIERS, messages: MESSAGES, commands: NAV_ITEMS };
    const projects = PROJECTS.filter(p => [p.id, p.name, p.location, p.stage, ...(p.categories || [])].join(' ').toLowerCase().includes(q));
    const suppliers = SUPPLIERS.filter(s => [s.name, s.city, s.website, ...(s.tags || []), ...(s.categories || [])].join(' ').toLowerCase().includes(q));
    const messages = MESSAGES.filter(m => [m.from, m.subject, m.preview].join(' ').toLowerCase().includes(q));
    const commands = NAV_ITEMS.filter(n => [n.label, n.id].join(' ').toLowerCase().includes(q));
    return { projects, suppliers, messages, commands };
  }
};

export const dashboardService = {
  metrics() { return METRICS; },
  leads() { return PORTAL_LEADS; },
  messages() { return MESSAGES; }
};
