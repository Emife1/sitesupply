export const escapeHtml = value => String(value ?? '')
  .replaceAll('&', '&amp;')
  .replaceAll('<', '&lt;')
  .replaceAll('>', '&gt;')
  .replaceAll('"', '&quot;')
  .replaceAll("'", '&#39;');

export const pill = (label, active = false, attrs = '') => `<button class="pill ${active ? 'primary' : ''}" ${attrs}>${escapeHtml(label)}</button>`;

export const navButton = (item, active, index = 0) => `<button class="nav-link ${active ? 'active' : ''}" data-route="${item.id}"><span class="nav-index">${String(index + 1).padStart(2, '0')}</span><span class="nav-text">${escapeHtml(item.label)}</span><span class="nav-arrow" aria-hidden="true">→</span></button>`;
export const mobileButton = (item, active, index = 0) => `<button class="mobile-link ${active ? 'active' : ''}" data-route="${item.id}"><span class="nav-index">${String(index + 1).padStart(2, '0')}</span><span>${escapeHtml(item.label)}</span></button>`;

export const hero = ({ kicker, title, accent = '', subtitle, actions = '' }) => `
  <section class="hero">
    <div class="hero-top">
      <div>
        <div class="kicker">${escapeHtml(kicker)}</div>
        <h1>${escapeHtml(title)}${accent ? ` <em>${escapeHtml(accent)}</em>` : ''}</h1>
        <p>${escapeHtml(subtitle)}</p>
      </div>
      <div class="topbar-actions">${actions}</div>
    </div>
  </section>`;

export const metricStrip = metrics => `<section class="grid-4">${metrics.map(m => `
  <div class="stat"><div class="label">${escapeHtml(m.label)}</div><div class="value">${escapeHtml(m.value)}</div><div class="hint">${escapeHtml(m.hint)}</div></div>`).join('')}</section>`;

export const cardList = html => `<div class="card-list">${html}</div>`;
export const panel = (title, sub, body) => {
  const slug = String(title).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
  return `
  <section class="panel panel-${slug}">
    <div class="panel-head"><div><h2 class="panel-title">${escapeHtml(title)}</h2><p class="panel-sub">${escapeHtml(sub)}</p></div></div>
    ${body}
  </section>`;
};

export const supplierCard = (s, selected = false) => `
  <button type="button" class="card ${selected ? 'selected' : ''}" data-supplier="${s.id}" aria-label="Open supplier ${escapeHtml(s.name)}">
    <div class="card-row">
      <div>
        <h3>${escapeHtml(s.name)}</h3>
        <p>${escapeHtml(s.city)}</p>
      </div>
      <span class="badge">★ ${Number(s.rating).toFixed(1)}</span>
    </div>
    <div class="tag-wrap">${(s.tags || []).map(t => `<span class="tag">${escapeHtml(t)}</span>`).join(' ')}</div>
    <div class="card-actions"><span class="tag">${escapeHtml(s.website)}</span><span class="tag">${escapeHtml(s.phone)}</span></div>
    <span class="card-cue">Open supplier <span aria-hidden="true">→</span></span>
  </button>`;

export const projectCard = (p, selected = false, pinned = false) => `
  <button type="button" class="card ${selected ? 'selected' : ''}" data-project="${p.id}" aria-label="Open project ${escapeHtml(p.name)}">
    <div class="card-row">
      <div>
        <h3>${escapeHtml(p.name)}</h3>
        <p>${escapeHtml(p.location)}</p>
      </div>
      <span class="chip">${escapeHtml(p.stage)}</span>
    </div>
    <div class="card-actions"><span class="tag">${escapeHtml(p.budget)}</span><span class="tag">${escapeHtml(p.supplierCount)} suppliers</span><span class="tag">Updated ${escapeHtml(p.updated)}</span>${pinned ? '<span class="tag accent">Pinned</span>' : ''}</div>
    <span class="card-cue">Open project <span aria-hidden="true">→</span></span>
  </button>`;

export const messageCard = m => `
  <div class="inspector-item activity-item">
    <div>
      <strong>${escapeHtml(m.subject)}</strong>
      <span>${escapeHtml(m.from)} · ${escapeHtml(m.preview)}</span>
    </div>
    <span class="tag">${escapeHtml(m.time)}</span>
  </div>`;

export const leadCard = l => `
  <div class="inspector-item lead-item">
    <div>
      <strong>${escapeHtml(l.title)}</strong>
      <span>${escapeHtml(l.note)}</span>
    </div>
    <span class="tag">${escapeHtml(l.status)}</span>
  </div>`;

export const quoteTable = rows => `
  <div class="table-wrap">
    <table class="table">
      <thead><tr><th>Supplier</th><th>Planning estimate</th><th>ETA</th><th>Demo fit</th><th>Notes</th></tr></thead>
      <tbody>
        ${rows.map(row => `<tr>
          <td><strong>${escapeHtml(row.supplier.name)}</strong><div class="muted">${escapeHtml(row.supplier.city)}</div></td>
          <td>${escapeHtml(row.total)}</td>
          <td>${escapeHtml(row.eta)}</td>
          <td>${escapeHtml(row.confidence)}%</td>
          <td>${row.notes.map(n => `<span class="tag">${escapeHtml(n)}</span>`).join(' ')}</td>
        </tr>`).join('')}
      </tbody>
    </table>
  </div>`;

export const commandOverlay = ({ open, query, results }) => `
  <div class="command-backdrop ${open ? 'show' : ''}" data-command-backdrop>
    <div class="command-panel" data-command-panel role="dialog" aria-modal="true" aria-labelledby="command-title">
      <div class="command-head">
        <div class="command-search-copy"><span id="command-title">Search workspace</span><small>Projects, suppliers, messages, and commands</small></div>
        <button type="button" class="pill" data-command-close aria-label="Close workspace search">Esc</button>
      </div>
      <input class="command-input" data-command-input autocomplete="off" aria-label="Search workspace" placeholder="Type to search…" value="${escapeHtml(query)}" />
      <div class="command-groups">
        <div class="command-group"><h3>Projects</h3>${results.projects.map(p => `<button class="command-item" data-project="${p.id}">${escapeHtml(p.name)}<span>${escapeHtml(p.location)}</span></button>`).join('') || '<div class="command-empty">No project matches</div>'}</div>
        <div class="command-group"><h3>Suppliers</h3>${results.suppliers.map(s => `<button class="command-item" data-supplier="${s.id}">${escapeHtml(s.name)}<span>${escapeHtml(s.city)}</span></button>`).join('') || '<div class="command-empty">No supplier matches</div>'}</div>
        <div class="command-group"><h3>Messages</h3>${results.messages.map(m => `<div class="command-item readonly">${escapeHtml(m.subject)}<span>${escapeHtml(m.from)}</span></div>`).join('') || '<div class="command-empty">No message matches</div>'}</div>
        <div class="command-group"><h3>Commands</h3>${results.commands.map(c => `<button class="command-item" data-route="${c.id}">${escapeHtml(c.label)}<span>Open section</span></button>`).join('') || '<div class="command-empty">No command matches</div>'}</div>
      </div>
    </div>
  </div>`;
