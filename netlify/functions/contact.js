const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
exports.handler = async (event) => {
  const origin = process.env.ALLOWED_ORIGIN || '*';
  const headers = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Allow': 'POST, OPTIONS'
  };
  const reply = (statusCode, body) => ({ statusCode, headers, body: body === null ? '' : JSON.stringify(body) });
  if (event.httpMethod === 'OPTIONS') return reply(204, null);
  if (event.httpMethod !== 'POST') return reply(405, { error: 'Method not allowed' });
  if (typeof event.body !== 'string' || event.isBase64Encoded || Buffer.byteLength(event.body) > 20000) return reply(400, { error: 'Invalid request body' });
  let payload;
  try { payload = JSON.parse(event.body); } catch { return reply(400, { error: 'Invalid JSON' }); }
  if (!payload || Array.isArray(payload) || typeof payload !== 'object') return reply(400, { error: 'Invalid payload' });
  if (['name', 'email', 'message'].some(key => typeof payload[key] !== 'string')) return reply(400, { error: 'name, email and message must be strings' });
  const name = payload.name.trim();
  const email = payload.email.trim();
  const message = payload.message.trim();
  if (!name || name.length > 120 || !message || message.length > 10000 || email.length > 254 || !emailPattern.test(email)) return reply(400, { error: 'Invalid name, email or message' });
  const { SENDGRID_API_KEY, TO_EMAIL, FROM_EMAIL } = process.env;
  if (!SENDGRID_API_KEY || !TO_EMAIL || !FROM_EMAIL || !emailPattern.test(TO_EMAIL) || !emailPattern.test(FROM_EMAIL)) return reply(503, { error: 'Email service not configured' });
  try {
    const response = await fetch('https://api.sendgrid.com/v3/mail/send', {
      method: 'POST',
      signal: AbortSignal.timeout(10000),
      headers: { Authorization: 'Bearer ' + SENDGRID_API_KEY, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        personalizations: [{ to: [{ email: TO_EMAIL }] }],
        from: { email: FROM_EMAIL },
        reply_to: { email },
        subject: 'Portfolio contact from ' + name.replace(/[\r\n]/g, ' '),
        content: [{ type: 'text/plain', value: 'Name: ' + name + '\nEmail: ' + email + '\n\n' + message }]
      })
    });
    if (!response.ok) return reply(502, { error: 'Failed to send email' });
    return reply(200, { ok: true });
  } catch { return reply(502, { error: 'Email service unavailable' }); }
};
