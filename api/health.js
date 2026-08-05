import { allowMethods, databaseReady, handleError, send, sql } from './_shared.js';

export default async function handler(req, res) {
  if (!allowMethods(req, res, ['GET'])) return;
  if (!databaseReady(res)) return;
  try {
    const rows = await sql`SELECT now() AS checked_at`;
    return send(res, 200, { ok: true, service: 'sitesupply-api', database: 'ready', checkedAt: rows[0].checked_at });
  } catch (error) {
    return handleError(res, error);
  }
}
