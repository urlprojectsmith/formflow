# FormFlow Agency + Role Dashboard

This repository now includes:
- React frontend
- Node.js API server (Express)
- Role-based login and role dashboards (Super Admin, Admin, Developer, User)
- Webhook endpoints
- Docker-ready full-stack setup

## Quick start (local development)

1. Install dependencies:
   - `npm install`
2. Create environment file:
   - `copy .env.example .env` (Windows) or `cp .env.example .env` (Linux/macOS)
3. Start API:
   - `npm run api:dev`
4. Start frontend (in another terminal):
   - `npm run dev`
5. Open:
   - Frontend: `http://localhost:4353`
   - API health: `http://localhost:4450/api/health`

If you want browser + API URLs in one place, set:

```
VITE_API_BASE_URL=http://localhost:4450
```

## Environment

`.env.example` includes:
- `PORT` (API port)
- `NODE_ENV`
- `CORS_ORIGIN`
- `WEBHOOK_SIGNING_SECRET`
- `VITE_API_BASE_URL`

## API Reference

All endpoints return:

```json
{ "ok": true, "data": ... }
```

for successful responses.

### Auth
- `POST /api/auth/login`
- `GET /api/me`
- `GET /api/roles`

#### Tenant-aware Auth
- `POST /api/auth/login` accepts:
  - `email`
  - `password`
  - `role` (`Super Admin`, `Admin`, `Developer`, `User`)
  - `tenantId` (required for non Super Admin roles)
- `tenantId` is optional for `Super Admin` users and enables master scope.

### Dashboard
- `GET /api/dashboard/metrics`
- `GET /api/dashboard/recent`

### Tenant Management (Super Admin only)
- `GET /api/tenants`
- `POST /api/tenants`
- `GET /api/tenants/:tenantId`
- `PATCH /api/tenants/:tenantId`
- `GET /api/tenants/:tenantId/users`
- `POST /api/tenants/:tenantId/users`

### Forms
- `GET /api/forms?q=search&status=draft`
- `POST /api/forms`
- `GET /api/forms/:id`
- `PUT /api/forms/:id`
- `PATCH /api/forms/:id/status`
- `DELETE /api/forms/:id`
- `GET /api/forms/:id/versions`
- `GET /api/forms/:id/definition`
- `PUT /api/forms/:id/definition`
- `POST /api/forms/:id/publish`
- `POST /api/forms/:id/rollback`
- `GET /api/forms/:id/submissions`
- `POST /api/forms/:id/submit`
- `GET /api/public/forms/:id`
- `POST /api/public/forms/:id/submit`

### Submissions
- `GET /api/submissions?formId=...&q=...`
- `PATCH /api/submissions/:id/read`

### Integrations
- `GET /api/integrations`
- `PATCH /api/integrations/:id/status`
- `POST /api/integrations/:id/test` (test one integration: `int_n8n`, `int_ghl`, `int_zapier`, `int_webhook`, `int_sheets`, `int_hubspot`, `int_slack`, `int_salesforce`, `int_stripe`, `int_mailchimp`)
- `POST /api/integrations/test-all` (test all integrations in one call)

### Domains
- `GET /api/domains`
- `POST /api/domains`

### Notifications
- `GET /api/notifications`
- `POST /api/notifications/:id/read`
- `POST /api/notifications/read-all`

### Webhooks
- `POST /api/webhooks/form-submission`
- `POST /api/webhooks/:provider`
- `GET /api/webhooks`

Optional header for protected webhooks:
- `x-signature: <sha256_hmac>` with `WEBHOOK_SIGNING_SECRET` if configured.

## Docker / VPS setup

Build and run API + frontend:

```bash
docker compose up -d --build
```

Services:
- `api` on `4450`
- `web` on `4353`

Useful commands:

```bash
docker compose ps
docker compose logs -f api
docker compose logs -f web
```
