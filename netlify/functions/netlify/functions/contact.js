// netlify/functions/contact.js
const fetch = require('node-fetch');
const validator = require('validator');

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': process.env.ALLOWED_ORIGIN || '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type'
      },
      body: ''
    };
  }

  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: JSON.stringify({ error: 'Method not allowed' }) };
  }

  let payload;
  try {
    payload = JSON.parse(event.body || '{}');
  } catch {
    return { statusCode: 400, body: JSON.stringify({ error: 'Invalid JSON' }) };
  }

  const name = (payload.name || '').trim();
  const email = (payload.email || '').trim();
  const message = (payload.message || '').trim();

  if (!name || !email || !message) {
    return { statusCode: 400, body: JSON.stringify({ error: 'name, email and message are required' }) };
  }
  if (!validator.isEmail(email)) {
    return { statusCode: 400, body: JSON.stringify({ error: 'Invalid email' }) };
  }

  const SENDGRID_API_KEY = process.env.SENDGRID_API_KEY;
  const TO_EMAIL = process.env.TO_EMAIL;
  const FROM_EMAIL = process.env.FROM_EMAIL || 'no-reply@yourdomain.com';

  if (!SENDGRID_API_KEY || !TO_EMAIL) {
    console.error('Missing email configuration');
    return { statusCode: 500, body: JSON.stringify({ error: 'Email service not configured' }) };
  }

  const mail = {
    personalizations: [{ to: [{ email: TO_EMAIL }] }],
    from: { email: FROM_EMAIL },
    subject: `Portfolio contact from ${name}`,
    content: [{ type: 'text/plain', value: `Name: ${name}\nEmail: ${email}\n\nMessage:\n${message}` }]
  };

  try {
    const res = await fetch('https://api.sendgrid.com/v3/mail/send', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${SENDGRID_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(mail)
    });

    if (!res.ok) {
      const text = await res.text();
      console.error('SendGrid error', res.status, text);
      return { statusCode: 502, body: JSON.stringify({ error: 'Failed to send email' }) };
    }

    // Optional persistence hook
    // Example: call a DB or cache here to store the message

    return {
      statusCode: 200,
      headers: { 'Access-Control-Allow-Origin': process.env.ALLOWED_ORIGIN || '*' },
      body: JSON.stringify({ ok: true })
    };
  } catch (err) {
    console.error('contact handler error', err);
    return { statusCode: 500, body: JSON.stringify({ error: 'Server error' }) };
  }
};
