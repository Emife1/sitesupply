import {
  allowMethods, clean, databaseReady, handleError, isBotTrap,
  optional, readBody, requestHash, send, sql, validEmail
} from './_shared.js';

export default async function handler(req, res) {
  if (!allowMethods(req, res, ['POST'])) return;
  if (!databaseReady(res)) return;
  try {
    const body = readBody(req);
    if (isBotTrap(body)) return send(res, 202, { ok: true });
    const name = clean(body.name, 120);
    const email = validEmail(body.email);
    const subject = clean(body.subject, 180);
    const message = clean(body.message, 5000);
    if (name.length < 2 || !email || subject.length < 3 || message.length < 10) {
      return send(res, 400, { ok: false, error: 'invalid_input' });
    }
    const rows = await sql`
      SELECT submit_contact_message(
        ${name}, ${email}, ${optional(body.company, 160)}, ${subject}, ${message}, ${requestHash(req)}
      ) AS id
    `;
    return send(res, 201, { ok: true, messageId: rows[0].id, message: 'Message received.' });
  } catch (error) {
    return handleError(res, error);
  }
}
