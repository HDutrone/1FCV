# 1FCV Ops

An operations SaaS platform for multi-branch companies: branches, HR structure
(directions → departments → services), employee affectations, trainings,
vacations, payroll, sales & stock, accounting, billing, CRM, audit, and
role-based user management — with a realtime activity feed powered by Redis.

This lives alongside, and is independent from, the "1 Futur Chez Vous" Flutter
app in the rest of this repository — different stack, different product.

## Stack

- **Frontend** — Next.js 14 (App Router) + TypeScript + pure CSS (CSS Modules
  and CSS variables, no framework). The App Router's client-side navigation
  already gives the single-page-application feel that `react-router-dom`
  would otherwise provide, so it's used directly rather than layering a
  second router underneath Next's own — see `frontend/README` for more.
- **Backend** — NestJS + Prisma (PostgreSQL) + Redis (`ioredis`) for a
  realtime pub/sub event bus, fanned out to clients over Socket.IO.
- **Auth** — JWT access/refresh tokens, role-based guards, two-step
  registration (account → profile).

## Structure

```
saas-platform/
  backend/    NestJS API — see backend/README.md
  frontend/   Next.js app — see frontend/README.md
```

## Quick start

```bash
# Backend
cd backend && cp .env.example .env
npm install && npm run prisma:migrate && npm run seed && npm run start:dev

# Frontend (separate terminal)
cd frontend && cp .env.example .env
npm install && npm run dev
```

Frontend: http://localhost:3000 — Backend: http://localhost:4000/api/v1

## What's implemented vs. what's scaffolded

- **Frontend**: fully built and build-verified — responsive marketing home
  page (scroll + load animations, illustrated hero), login, two-step
  registration wizard, and an admin shell with all 12 module panels
  (branches, HR structure, employees, affectation history, trainings,
  vacations, payroll, sales & stock, accounting, billing, CRM, audit,
  users & roles). Module pages currently render from `src/lib/mockData.ts`
  for a fully populated demo without a running backend — swapping in live
  data is a matter of replacing those imports with `api.get(...)` calls
  (see `src/lib/api.ts`).
- **Backend**: NestJS module per domain with real Prisma-backed CRUD, JWT
  auth, role guards, and Redis-backed realtime events. Not build-verified
  in this environment (needs a Postgres + Redis instance); review
  `backend/README.md` before running it.
