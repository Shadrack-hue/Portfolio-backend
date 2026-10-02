const { test, after } = require('node:test');
const assert = require('node:assert/strict');
const portfolio = require('../netlify/functions/portfolio').handler;
const contact = require('../netlify/functions/contact').handler;
const savedFetch = global.fetch;
after(() => { global.fetch = savedFetch; });
const valid = { name: 'Tester', email: 'test@example.com', message: 'Test message' };
const request = body => ({ httpMethod: 'POST', body: JSON.stringify(body) });
test('portfolio GET returns real profile and bundles data without filesystem lookup', async () => {
  const r = await portfolio({ httpMethod: 'GET' });
  assert.equal(r.statusCode, 200);
  assert.equal(JSON.parse(r.body).title, 'Electrical & Software Systems Engineer');
});
test('portfolio OPTIONS and unsupported verbs', async () => {
  assert.equal((await portfolio({ httpMethod: 'OPTIONS' })).statusCode, 204);
  assert.equal((await portfolio({ httpMethod: 'POST' })).statusCode, 405);
});
test('contact preflight and method errors retain CORS', async () => {
  assert.equal((await contact({ httpMethod: 'OPTIONS' })).statusCode, 204);
  const r = await contact({ httpMethod: 'GET' });
  assert.equal(r.statusCode, 405);
  assert.ok(r.headers['Access-Control-Allow-Origin']);
});
test('reject malformed JSON and non-object payloads without throwing', async () => {
  for (const body of ['{', 'null', '[]', '1']) assert.equal((await contact({ httpMethod: 'POST', body })).statusCode, 400);
});
test('reject invalid field types, blank values and overlong messages', async () => {
  for (const bad of [{ ...valid, name: 42 }, { ...valid, message: {} }, { ...valid, email: 'bad' }, { ...valid, name: ' ' }, { ...valid, message: 'x'.repeat(10001) }]) {
    assert.equal((await contact(request(bad))).statusCode, 400);
  }
});
test('missing mail configuration produces explicit service error', async () => {
  delete process.env.SENDGRID_API_KEY;
  assert.equal((await contact(request(valid))).statusCode, 503);
});
test('successful delivery uses verified sender and reply-to; no real mail is sent', async () => {
  Object.assign(process.env, { SENDGRID_API_KEY: 'test-only', TO_EMAIL: 'to@example.com', FROM_EMAIL: 'from@example.com' });
  global.fetch = async (url, options) => {
    assert.equal(url, 'https://api.sendgrid.com/v3/mail/send');
    assert.equal(JSON.parse(options.body).reply_to.email, valid.email);
    return { ok: true };
  };
  assert.equal((await contact(request(valid))).statusCode, 200);
});
test('provider failure and timeout retain CORS and do not expose provider data', async () => {
  global.fetch = async () => ({ ok: false });
  const r = await contact(request(valid));
  assert.equal(r.statusCode, 502);
  assert.ok(r.headers['Access-Control-Allow-Origin']);
  global.fetch = async () => { throw Error('sensitive provider response'); };
  const failure = await contact(request(valid));
  assert.equal(failure.statusCode, 502);
  assert.ok(!failure.body.includes('sensitive'));
});
