# Portfolio API

Shadrack Favour · Electrical & Software Systems Engineer.

Deploy this repository to Netlify with Node.js 22. `netlify.toml` publishes `public/` and bundles `netlify/functions`. Profile data is imported directly so it is included in the serverless bundle.

- GET `/.netlify/functions/portfolio`: public profile and project links.
- POST `/.netlify/functions/contact`: JSON `{ name, email, message }`.
- OPTIONS is supported for both endpoints; all responses include CORS headers.

Required contact configuration: `SENDGRID_API_KEY`, `TO_EMAIL`, and `FROM_EMAIL` (a SendGrid verified sender). Set `ALLOWED_ORIGIN=https://shadrackweb.vercel.app` for the production frontend. Missing mail configuration returns 503; provider failure returns 502 without exposing provider responses.

Run `npm test`. Tests mock the mail provider and send no email. Netlify CLI is required for `netlify dev`.

Production portfolio source: `project2`, matching the HTML served at https://shadrackweb.vercel.app on 2 October 2026. This backend's current production linkage has not been verified; Vercel team access is blocked, and this API uses Netlify Functions paths.
