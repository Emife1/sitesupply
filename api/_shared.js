import crypto from 'node:crypto';
import { neon } from '@neondatabase/serverless';

const connectionString = process.env.DATABASE_URL;
export const sql = connectionString ? neon(connectionString) : null;

export const CATEGORIES = new Set([
  'aggregates', 'equipment_rental', 'freight', 'accessibility', 'site_services', 'other'
]);

export function setApiHeaders(res) {
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
}

export function send(res, status, payload) {
  setApiHeaders(res);
  return res.status(status).json(payload);
}

export function allowMethods(req, res, methods) {
  if (req.method === 'OPTIONS') {
    res.setHeader('Allow', methods.join(', '));
    res.status(204).end();
    return false;
  }
  if (!methods.includes(req.method)) {
    res.setHeader('Allow', methods.join(', '));
    send(res, 405, { ok: false, error: 'method_not_allowed' });
    return false;
  }
  return true;
}

export function readBody(req) {
  const length = Number(req.headers['content-length'] || 0);
  if (length > 24_000) throw new Error('payload_too_large');
  if (!req.body) return {};
  if (typeof req.body === 'string') return JSON.parse(req.body);
  return req.body;
}

export function clean(value, max = 500) {
  return String(value ?? '').trim().replace(/\s+/g, ' ').slice(0, max);
}

export function optional(value, max = 500) {
  const output = clean(value, max);
  return output || null;
}

export function validEmail(value) {
  const email = clean(value, 254).toLowerCase();
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ? email : null;
}

export function requestHash(req) {
  const forwarded = String(req.headers['x-forwarded-for'] || '').split(',')[0].trim();
  const source = forwarded || req.socket?.remoteAddress || 'unknown';
  const salt = process.env.RATE_LIMIT_SALT || 'sitesupply-runtime';
  return crypto.createHash('sha256').update(`${salt}:${source}`).digest('hex');
}

export function isBotTrap(body) {
  return Boolean(clean(body?.fax_number, 200));
}

export function databaseReady(res) {
  if (sql) return true;
  send(res, 503, { ok: false, error: 'service_unavailable' });
  return false;
}

export function handleError(res, error) {
  const message = String(error?.message || error || 'unknown_error');
  if (message.includes('rate_limit_exceeded')) return send(res, 429, { ok: false, error: 'rate_limit_exceeded' });
  if (message.includes('consent_required')) return send(res, 400, { ok: false, error: 'consent_required' });
  if (message.includes('payload_too_large')) return send(res, 413, { ok: false, error: 'payload_too_large' });
  if (message.includes('invalid_input') || message.includes('violates check constraint')) return send(res, 400, { ok: false, error: 'invalid_input' });
  console.error('SiteSupply API error', { name: error?.name, code: error?.code });
  return send(res, 500, { ok: false, error: 'internal_error' });
}
