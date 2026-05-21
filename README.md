# Netlify Functions Backend for Portfolio

## What this repo contains
- Netlify Functions endpoints:
  - `/.netlify/functions/portfolio` GET returns `data/portfolio.json`
  - `/.netlify/functions/contact` POST accepts `{ name, email, message }` and sends email via SendGrid

## Setup
1. Install dependencies
   npm install

2. Local development
   Install Netlify CLI globally if you don't have it
   npm i -g netlify-cli
   netlify dev

3. Environment variables to set in Netlify Site settings or locally in a `.env` file for `netlify dev`
   - SENDGRID_API_KEY  Set to your SendGrid API key
   - TO_EMAIL          Destination email for contact form messages
   - FROM_EMAIL        Optional from address used in outgoing mail
   - ALLOWED_ORIGIN    Optional CORS origin, e.g., https://engshadrackweb.netlify.app

## Deploy
- Push to a Git repository and connect the repo to Netlify
- Set the environment variables in Netlify UI under Site settings → Build & deploy → Environment
- Trigger a deploy

## Frontend usage
- Fetch portfolio
  fetch('/.netlify/functions/portfolio')

- Submit contact
  fetch('/.netlify/functions/contact', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, email, message })
  })

## Optional enhancements
- Persist messages to Supabase or Upstash after successful email send
- Add reCAPTCHA on the frontend and verify token in `contact.js`
- Add rate limiting or simple in-memory throttling for spam protection
