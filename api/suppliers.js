import {
  CATEGORIES, allowMethods, clean, databaseReady, handleError, isBotTrap,
  optional, readBody, requestHash, send, sql, validEmail
} from './_shared.js';

export default async function handler(req, res) {
  if (!allowMethods(req, res, ['GET', 'POST'])) return;
  if (!databaseReady(res)) return;
  try {
    if (req.method === 'GET') {
      const rows = await sql`
        SELECT id, name, slug, description, city, province_state, country_code,
               website, phone, public_email, categories, tags, service_radius_km, verified, featured
        FROM public_suppliers
        ORDER BY featured DESC, name ASC
        LIMIT 100
      `;
      return send(res, 200, { ok: true, suppliers: rows });
    }

    const body = readBody(req);
    if (isBotTrap(body)) return send(res, 202, { ok: true });
    const companyName = clean(body.company_name, 160);
    const contactName = clean(body.contact_name, 120);
    const email = validEmail(body.email);
    const location = clean(body.location, 200);
    const categories = Array.isArray(body.categories)
      ? body.categories.map(value => clean(value, 40)).filter(value => CATEGORIES.has(value)).slice(0, 6)
      : [];

    if (companyName.length < 2 || contactName.length < 2 || !email || location.length < 2 || categories.length === 0) {
      return send(res, 400, { ok: false, error: 'invalid_input' });
    }

    const rows = await sql`
      SELECT submit_supplier_application(
        ${companyName}, ${contactName}, ${email}, ${optional(body.phone, 60)},
        ${optional(body.website, 240)}, ${location}, ${categories}::text[],
        ${optional(body.message, 3000)}, ${requestHash(req)}
      ) AS id
    `;
    return send(res, 201, { ok: true, applicationId: rows[0].id, message: 'Supplier application received.' });
  } catch (error) {
    return handleError(res, error);
  }
}
