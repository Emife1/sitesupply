const $ = (selector, scope = document) => scope.querySelector(selector);
const $$ = (selector, scope = document) => [...scope.querySelectorAll(selector)];

const menuButton = $('[data-menu-button]');
const nav = $('[data-main-nav]');
if (menuButton && nav) {
  menuButton.addEventListener('click', () => {
    const open = nav.classList.toggle('open');
    menuButton.setAttribute('aria-expanded', String(open));
  });
  nav.addEventListener('click', () => {
    nav.classList.remove('open');
    menuButton.setAttribute('aria-expanded', 'false');
  });
}

$$('[data-year]').forEach(node => { node.textContent = String(new Date().getFullYear()); });

const toast = $('[data-toast]');
function showToast(message) {
  if (!toast) return;
  toast.textContent = message;
  toast.classList.add('show');
  window.setTimeout(() => toast.classList.remove('show'), 4500);
}

function setStatus(form, type, message) {
  const status = $('[data-form-status]', form);
  if (!status) return;
  status.className = `form-status show ${type}`;
  status.textContent = message;
  status.setAttribute('role', type === 'error' ? 'alert' : 'status');
}

function serializeForm(form) {
  const data = new FormData(form);
  const body = Object.fromEntries(data.entries());
  body.categories = data.getAll('categories');
  body.consent_to_contact = data.get('consent_to_contact') === 'on';
  return body;
}

async function submitForm(form) {
  const endpoint = form.dataset.endpoint;
  const button = $('button[type="submit"]', form);
  const original = button?.textContent || 'Submit';
  try {
    if (button) { button.disabled = true; button.textContent = 'Submitting…'; }
    setStatus(form, '', '');
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(serializeForm(form))
    });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok || !payload.ok) throw new Error(payload.error || 'submission_failed');
    const reference = payload.reference ? ` Reference: ${payload.reference}.` : '';
    setStatus(form, 'success', `${payload.message || 'Received.'}${reference}`);
    showToast(payload.message || 'Your submission was received.');
    form.reset();
  } catch (error) {
    const friendly = error.message === 'rate_limit_exceeded'
      ? 'Too many requests were submitted. Please try again later.'
      : error.message === 'service_unavailable'
        ? 'The submission service is temporarily unavailable.'
        : 'We could not submit this form. Please review the fields and try again.';
    setStatus(form, 'error', friendly);
  } finally {
    if (button) { button.disabled = false; button.textContent = original; }
  }
}

$$('form[data-endpoint]').forEach(form => {
  form.addEventListener('submit', event => {
    event.preventDefault();
    if (!form.reportValidity()) return;
    submitForm(form);
  });
});

function supplierCard(supplier) {
  const location = [supplier.city, supplier.province_state, supplier.country_code].filter(Boolean).join(', ');
  const categories = (supplier.categories || []).map(value => `<span class="chip">${escapeHtml(value.replaceAll('_', ' '))}</span>`).join('');
  const website = supplier.website
    ? `<a href="${safeUrl(supplier.website)}" target="_blank" rel="noopener noreferrer">Visit website</a>`
    : '';
  return `<article class="supplier-card">
    <div class="mini-row"><span class="chip">${supplier.verified ? 'Verified' : 'Listed'}</span>${supplier.featured ? '<span class="status">Featured</span>' : ''}</div>
    <h3>${escapeHtml(supplier.name)}</h3>
    <p>${escapeHtml(supplier.description || 'Construction supply partner in the SiteSupply network.')}</p>
    <p><strong>${escapeHtml(location || 'Ontario service area')}</strong></p>
    <div class="supplier-meta">${categories}</div>
    ${website ? `<p>${website}</p>` : ''}
  </article>`;
}

async function loadSuppliers() {
  const target = $('[data-supplier-list]');
  if (!target) return;
  try {
    const response = await fetch('/api/suppliers', { headers: { Accept: 'application/json' } });
    const payload = await response.json();
    if (!response.ok || !payload.ok) throw new Error('load_failed');
    if (!payload.suppliers.length) {
      target.innerHTML = `<div class="empty-state" style="grid-column:1/-1">
        <span class="eyebrow">Founding network</span>
        <h3>Supplier onboarding is open.</h3>
        <p>Approved supplier profiles will appear here as the Ontario launch network is verified.</p>
        <a class="button accent" href="#apply">Apply as a supplier</a>
      </div>`;
      return;
    }
    target.innerHTML = payload.suppliers.map(supplierCard).join('');
  } catch {
    target.innerHTML = `<div class="empty-state" style="grid-column:1/-1"><h3>Directory temporarily unavailable</h3><p>Supplier applications are still open below.</p></div>`;
  }
}
loadSuppliers();

function escapeHtml(value) {
  return String(value ?? '').replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;').replaceAll("'", '&#39;');
}
function safeUrl(value) {
  try {
    const url = new URL(value.startsWith('http') ? value : `https://${value}`);
    return ['http:', 'https:'].includes(url.protocol) ? url.href : '#';
  } catch { return '#'; }
}

const params = new URLSearchParams(location.search);
const campaign = ['utm_source','utm_medium','utm_campaign'].reduce((out,key) => {
  if (params.get(key)) out[key] = params.get(key);
  return out;
}, {});
if (Object.keys(campaign).length) sessionStorage.setItem('sitesupply_campaign', JSON.stringify(campaign));
