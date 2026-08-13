# 1FCV Ops — Backend (NestJS)

REST + WebSocket API for the operations platform: branches, HR structure
(directions → departments → services), employee affectations, trainings,
vacations, payroll, sales, stock, audit, accounting, billing and CRM.

## Stack

- **NestJS 10** (TypeScript)
- **Prisma** + PostgreSQL for persistence
- **Redis** (`ioredis`) as the realtime pub/sub bus — every module publishes
  domain events (`employee.affected`, `stock.low`, `invoice.paid`, …) on the
  `ops:events` channel; `NotificationsGateway` fans them out over Socket.IO
  so every connected dashboard updates live, and so the bus works the same
  way once the API is scaled to multiple instances.
- **JWT** access/refresh auth with a global `RolesGuard` (`@Roles(...)`)

## Getting started

```bash
cp .env.example .env        # point at your Postgres + Redis
npm install
npm run prisma:migrate      # creates the schema
npm run seed                # demo company/branch/admin user
npm run start:dev           # http://localhost:4000/api/v1
```

Demo login after seeding: `admin@1fcv-ops.dev` / `Admin123!`

## Two-step registration

- `POST /api/v1/auth/register/step-1` — email, password, company name → creates the
  account + company shell (`onboardingStep: 1`), no tokens issued yet.
- `POST /api/v1/auth/register/step-2` — profile details (name, phone, sector) →
  completes onboarding and returns access/refresh tokens.

## Module map

| Domain | Base route |
| --- | --- |
| Branches | `/branches` |
| HR structure & org chart | `/hr` |
| Employees | `/employees` |
| Affectation history | `/affectation-history` |
| Trainings | `/trainings` |
| Vacations | `/vacations` |
| Payroll | `/payroll` |
| Sales | `/sales` |
| Stock | `/stock` |
| Audit | `/audit` |
| Accounting | `/accounting` |
| Billing | `/billing` |
| CRM | `/crm/customers` |
| Users & roles | `/users`, `/roles` |

Realtime events: connect Socket.IO to `/realtime` and listen for `event`.
