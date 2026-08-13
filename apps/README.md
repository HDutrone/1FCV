# 1FCV Suite — Enterprise SaaS platform

A first pass at a company operations platform: branches, HR (directions,
departments, services, affectations), employee trainings & vacations,
payroll, sales & stock, accounting, billing, CRM, audit, and system
users/roles — in one responsive web app.

This lives alongside the existing Flutter app at the repo root; it is an
unrelated product built with a different stack (Next.js + NestJS).

## What's here

- **`web/`** — Next.js 16 (App Router) + Tailwind CSS v4 frontend. Modern
  home page, login page, a two-step registration wizard, and an admin panel
  covering every module, all responsive down to mobile.
- **`api/`** — NestJS backend with real JWT authentication (two-step
  register, login), Prisma + SQLite, and a Redis-backed Socket.IO gateway
  for real-time notifications.

Only auth is implemented end-to-end on the backend for this first pass; the
other admin modules are UI shells with representative mock data, ready to be
wired up to real endpoints module by module.

## Running locally

```bash
# 1. Start Redis (only external dependency)
docker compose up -d

# 2. Backend
cd api
cp .env.example .env
npm install
npx prisma migrate dev
npm run start:dev        # http://localhost:3001/api

# 3. Frontend (separate terminal)
cd web
cp .env.example .env.local
npm install
npm run dev               # http://localhost:3000
```

Visit `http://localhost:3000`, register a workspace (two steps), and you'll
land on `/admin`.

## Architecture notes

- **Auth cookie**: the browser never talks to the NestJS API directly for
  auth. Next.js Route Handlers under `web/src/app/api/auth/*` proxy the
  calls and store the API's JWT as an `httpOnly` cookie, so it's never
  readable from client-side JavaScript. `web/src/proxy.ts` does an
  optimistic redirect for `/admin/*`, and `web/src/app/admin/layout.tsx`
  does the real check by resolving the session against the API.
- **Two-step registration**: step 1 creates the company + an admin user in
  `PENDING` status and returns a short-lived (30 min) token. Step 2
  completes the profile and activates the account, returning a normal
  7-day token. Logging in mid-way (status still `PENDING`) redirects back
  into step 2 instead of step 1.
- **Real-time**: `api/src/notifications` exposes a Socket.IO gateway
  (`/notifications` namespace) backed by Redis pub/sub, so events published
  from any API instance reach every connected browser tab for that company.
  The frontend fetches a short-lived socket token from
  `/api/auth/socket-token` (itself gated by the httpOnly cookie) rather than
  ever storing the JWT in client-readable storage.
