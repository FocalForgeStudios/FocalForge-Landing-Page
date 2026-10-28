# Focal Forge API

A small Node.js/Express API for project inquiries and published portfolio records. PostgreSQL can be hosted on Neon or any compatible managed PostgreSQL service.

## Local setup

Requirements: Node.js 20+ and PostgreSQL.

```sh
cd backend
cp .env.example .env
# Set DATABASE_URL and any webhook/CORS settings in .env
npm install
npm run db:migrate
npm run dev
```

Health check: `GET /health`  
Published portfolio: `GET /api/projects`  
New enquiry: `POST /api/inquiries`

Example request body:

```json
{
  "name": "Example Client",
  "email": "client@example.com",
  "service": "Software & web",
  "brief": "We need a responsive website with a clear project enquiry workflow.",
  "estimate": "UGX 1,500k – UGX 4,800k (indicative)",
  "source": "focal-forge-website"
}
```

## Frontend connection

Set the value of `<meta name="ff-api-base" content="">` in the root `index.html` to the deployed API origin, for example `https://api.example.com`. Keep it empty to use the static-site fallback. Add the exact production frontend origin to `CORS_ORIGINS`.

## Security notes

- Keep `.env`, database credentials, and webhook secrets out of version control.
- Configure HTTPS at the deployment platform; use a managed database with TLS.
- The inquiry endpoint validates payloads with Zod, limits JSON size, and applies per-IP rate limiting.
- Webhook delivery is best-effort after the inquiry is committed; failures are logged without discarding the lead.
- CORS is an origin policy, not authentication. Add CAPTCHA/Turnstile and operational monitoring before public launch.
- Admin CRUD/authentication for the portfolio is intentionally not exposed in this public API. Manage records through a secured CMS/admin tool or a controlled database workflow. Never expose database credentials or unauthenticated write endpoints.
- The client workspace on the public site is an interactive UI demonstration only. A real portal needs authentication, per-client authorization, audit logs, and expiring object-storage URLs before it can handle private documents.
- No real client projects are seeded. Publish only approved, fact-checked case studies.

## Deployment

Deploy this folder as a Node 20+ service, set environment variables in the host dashboard, provision PostgreSQL, run `npm run db:migrate` once, then configure the frontend API base and CORS origin. Do not commit production secrets.
