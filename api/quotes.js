import {
  CATEGORIES, allowMethods, clean, databaseReady, handleError, isBotTrap,
  optional, readBody, requestHash, send, sql, validEmail
} from './_shared.js';

export default async function handler(req, res) {
  if (!allowMethods(req, res, ['POST'])) return;
  if (!databaseReady(res)) return;
  try {
    const body = readBody(req);
    if (isBotTrap(body)) return send(res, 202, { ok: true });

    const requesterName = clean(body.requester_name, 120);
    const requesterEmail = validEmail(body.requester_email);
    const company = optional(body.requester_company, 160);
    const category = clean(body.category, 40);
    const title = clean(body.title, 180);
    const location = clean(body.delivery_location, 200);
    const quantity = body.quantity === '' || body.quantity == null ? null : Number(body.quantity);
    const unit = optional(body.unit, 40);
    const consent = body.consent_to_contact === true || body.consent_to_contact === 'true' || body.consent_to_contact === 'on';

    if (requesterName.length < 2 || !requesterEmail || !CATEGORIES.has(category) || title.length < 3 || location.length < 2 || !consent) {
      return send(res, 400, { ok: false, error: 'invalid_input' });
    }
    if (quantity != null && (!Number.isFinite(quantity) || quantity < 0 || quantity > 10_000_000)) {
      return send(res, 400, { ok: false, error: 'invalid_quantity' });
    }

    const specifications = JSON.stringify({
      description: optional(body.description, 3000),
      deadline: optional(body.deadline, 80),
      material: optional(body.material, 120),
      equipment: optional(body.equipment, 120),
      load: optional(body.load, 120)
    });

    const rows = await sql`
      SELECT * FROM submit_rfq(
        ${requesterName}, ${requesterEmail}, ${company}, ${category}, ${title}, ${location},
        ${quantity}, ${unit}, ${specifications}::jsonb, ${consent}, ${requestHash(req)}
      )
    `;
    return send(res, 201, {
      ok: true,
      reference: rows[0].public_ref,
      message: 'Your request has been received for review.'
    });
  } catch (error) {
    return handleError(res, error);
  }
}
