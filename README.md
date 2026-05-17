# GoalTrack - Goal Management Portal

GoalTrack is a full-stack performance management portal for creating, approving, tracking, and reporting employee goals across an organization. It supports employee goal sheets, manager approvals and check-ins, admin cycle management, audit logs, and CSV reporting.

The project is organized as a two-app workspace:

- `goal-portal/frontend` - Next.js app for employees, managers, and admins.
- `goal-portal/backend` - NestJS REST API backed by PostgreSQL through Prisma.

## Features

- Role-based authentication for `EMPLOYEE`, `MANAGER`, and `ADMIN` users.
- Employee goal creation, editing, submission, and quarterly check-ins.
- Manager team views, goal approvals, returns for rework, inline manager edits, shared goals, and team analysis.
- Admin user management, reporting, cycle configuration, audit log review, and goal unlocks.
- Goal scoring for numeric, percentage, timeline, zero-based, and inverse "lower is better" KPIs.
- Active performance cycles with phases from goal setting through Q1-Q4 check-ins and closed state.
- CSV exports and completion analytics for admins and managers.

## Tech Stack

| Layer | Technology |
| --- | --- |
| Frontend | Next.js 16, React 19, TypeScript |
| UI | Tailwind CSS 4, Radix UI, Lucide React, Framer Motion |
| Data Fetching | Axios, TanStack Query |
| Backend | NestJS 11, TypeScript |
| Database | PostgreSQL |
| ORM | Prisma 7 |
| Auth | JWT, Passport |
| Validation | class-validator, class-transformer, Zod |
| Reports | csv-stringify |
| Email | Resend |

## Repository Structure

```text
.
+-- goal-portal/
|   +-- backend/
|   |   +-- prisma/
|   |   |   +-- schema.prisma
|   |   |   +-- seed.ts
|   |   +-- src/
|   |       +-- auth/
|   |       +-- audit/
|   |       +-- checkins/
|   |       +-- cycles/
|   |       +-- email/
|   |       +-- goals/
|   |       +-- prisma/
|   |       +-- reports/
|   |       +-- users/
|   +-- frontend/
|   |   +-- app/
|   |   +-- components/
|   |   +-- hooks/
|   |   +-- lib/
|   +-- render.yaml
|   +-- shared/
+-- README.md
```

## Prerequisites

- Node.js 20 or newer
- npm
- PostgreSQL database

## Environment Variables

Create `goal-portal/backend/.env`:

```env
DATABASE_URL="postgresql://USER:PASSWORD@HOST:PORT/DATABASE"
DIRECT_URL="postgresql://USER:PASSWORD@HOST:PORT/DATABASE"
JWT_SECRET="replace-with-a-secure-secret"
FRONTEND_URL="http://localhost:3000"
PORT=3001
```

Create `goal-portal/frontend/.env.local`:

```env
NEXT_PUBLIC_API_URL="http://localhost:3001"
```

The frontend code has a local fallback of `http://localhost:3000`, so setting `NEXT_PUBLIC_API_URL` is important when the API runs on the backend default port `3001`.

## Getting Started

Install and start the backend:

```bash
cd goal-portal/backend
npm install
npx prisma generate
npx prisma db push
npm run seed
npm run start:dev
```

In a second terminal, install and start the frontend:

```bash
cd goal-portal/frontend
npm install
npm run dev
```

Open the frontend at:

```text
http://localhost:3000
```

The backend listens on:

```text
http://localhost:3001
```

## Seeded Login Accounts

Running `npm run seed` in `goal-portal/backend` creates these demo users:

| Role | Email | Password |
| --- | --- | --- |
| Admin | `admin@example.com` | `password123` |
| Manager | `manager@example.com` | `password123` |
| Employee | `employee@example.com` | `password123` |

The seed also creates an active cycle named `FY 2026-27`.

## Application Flow

1. Users log in through `/login`.
2. The frontend redirects each role to its main workspace:
   - Admin: `/users`
   - Manager: `/team`
   - Employee: `/goals`
3. Employees create goals and submit them for approval.
4. Managers approve, return, edit, or create shared goals for their team.
5. During active check-in phases, users record quarterly achievements.
6. The backend calculates progress scores and stores check-in history.
7. Admins manage cycles, users, audit logs, and reporting.

## Backend API Overview

All protected endpoints use JWT authentication. Role restrictions are enforced with NestJS guards.

| Area | Endpoints |
| --- | --- |
| Auth | `POST /auth/login` |
| Goals | `GET /goals/mine`, `POST /goals`, `PATCH /goals/:id`, `DELETE /goals/:id`, `POST /goals/submit`, `PATCH /goals/:id/submit` |
| Manager Goals | `GET /goals/team`, `PATCH /goals/:id/approve`, `PATCH /goals/:id/return`, `PATCH /goals/:id/manager-edit`, `POST /goals/shared` |
| Admin Goals | `GET /goals/auto-approved`, `PATCH /goals/:id/unlock` |
| Check-ins | `POST /checkins`, `GET /checkins/:goalId`, `PATCH /checkins/:id/comment` |
| Users | `GET /users`, `POST /users`, `PATCH /users/:id`, `DELETE /users/:id`, `GET /users/org-tree`, `GET /users/managers` |
| Cycles | `GET /cycles`, `GET /cycles/active`, `POST /cycles`, `PATCH /cycles/:id/activate`, `PATCH /cycles/:id/phase`, `POST /cycles/reset` |
| Reports | `GET /reports/export`, `GET /reports/completion` |
| Audit | `GET /audit` |

## Database Model

The Prisma schema includes:

- `User` - employees, managers, admins, and reporting hierarchy.
- `Cycle` - active performance windows and phases.
- `Goal` - goal metadata, weightage, status, locking, shared-goal metadata, and scoring flags.
- `GoalUpdate` - quarterly achievements, comments, status updates, and computed progress scores.
- `AuditLog` - tracked create, update, approve, return, unlock, and delete actions.

Key enums include `Role`, `UomType`, `GoalStatus`, and `CyclePhase`.

## Useful Scripts

Backend scripts from `goal-portal/backend`:

```bash
npm run start:dev     # Run NestJS in watch mode
npm run build         # Generate Prisma client and build the API
npm run start:prod    # Run the compiled API
npm run seed          # Seed demo users and default cycle
npm run lint          # Lint and auto-fix backend files
npm run test          # Run unit tests
npm run test:e2e      # Run e2e tests
```

Frontend scripts from `goal-portal/frontend`:

```bash
npm run dev           # Run Next.js locally
npm run build         # Build the frontend
npm run start         # Start the built frontend
npm run lint          # Run ESLint
```

## Deployment Notes

`goal-portal/render.yaml` defines a Render web service for the backend:

- Root directory: `backend`
- Build command: `npm install --include=dev && npm run build`
- Start command: `npm run start:prod`
- Required environment variables: `DATABASE_URL`, `DIRECT_URL`, `JWT_SECRET`, `FRONTEND_URL`

For frontend deployment, configure `NEXT_PUBLIC_API_URL` to point at the deployed API URL.

## Development Notes

- Goal weightage is modeled as a percentage and is expected to total 100 per employee.
- Individual goal weightage should be at least 10.
- Submitted and approved goals can be locked; admins can unlock when needed.
- Managers can only report on their own team, while admins can filter reports by manager.
- Audit logs are stored for important goal and check-in changes.

## License

This project is currently marked as private and unlicensed in package metadata.
