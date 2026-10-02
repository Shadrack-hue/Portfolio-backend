const data = require('../../data/portfolio.json');
exports.handler = async (event) => ({
  statusCode: event.httpMethod === 'GET' ? 200 : event.httpMethod === 'OPTIONS' ? 204 : 405,
  headers: {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': process.env.ALLOWED_ORIGIN || '*',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Allow': 'GET, OPTIONS'
  },
  body: event.httpMethod === 'GET' ? JSON.stringify(data) : event.httpMethod === 'OPTIONS' ? '' : JSON.stringify({ error: 'Method not allowed' })
});
