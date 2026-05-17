# GoalTrack Backend

This is the NestJS backend for GoalTrack. It exposes the REST API used by the Next.js frontend, handles authentication and role-based access, manages goal lifecycle rules, computes check-in progress scores, writes audit logs, and exports reports.

## Tech Stack

- NestJS 11
- TypeScript
- PostgreSQL
- Prisma 7 with `@prisma/adapter-pg`
- Passport JWT authentication
- bcrypt password hashing
- class-validator and class-transformer
- csv-stringify for report exports
- Resend for email notifications
- Jest and Supertest for tests

## Current Project Structure

```text
backend/
+-- prisma/
|   +-- schema.prisma            # Database models and enums
|   +-- seed.ts                  # Demo users and active cycle seed
+-- src/
|   +-- main.ts                  # App bootstrap, validation pipe, CORS
|   +-- app.module.ts            # Root module registration
|   +-- auth/                    # Login, JWT strategy, guards, role decorator
|   +-- users/                   # Admin user and hierarchy management
|   +-- goals/                   # Goal lifecycle, approval, shared goals
|   +-- checkins/                # Quarterly updates and scoring
|   +-- cycles/                  # Active cycle and phase management
|   +-- reports/                 # CSV export and completion dashboard APIs
|   +-- audit/                   # Audit controller and interceptor
|   +-- email/                   # Resend email service
|   +-- prisma/                  # Prisma service/module
+-- test/
    +-- app.e2e-spec.ts
    +-- jest-e2e.json
```

## Environment Variables

Create `backend/.env`:

```env
DATABASE_URL="postgresql://USER:PASSWORD@HOST:PORT/DATABASE"
DIRECT_URL="postgresql://USER:PASSWORD@HOST:PORT/DATABASE"
JWT_SECRET="replace-with-a-secure-secret"
FRONTEND_URL="http://localhost:3000"
PORT=3001
RESEND_API_KEY="optional-resend-api-key"
RESEND_TO_OVERRIDE="optional-dev-recipient@example.com"
```

`FRONTEND_URL` is used for CORS. If `PORT` is not set, the API listens on `3001`.

## Local Development

Install dependencies:

```bash
npm install
```

Generate Prisma client and create/update database tables:

```bash
npx prisma generate
npx prisma db push
```

Seed demo data:

```bash
npm run seed
```

Start the API:

```bash
npm run start:dev
```

The API runs at:

```text
http://localhost:3001
```

## Seeded Demo Accounts

`npm run seed` creates:

| Role | Email | Password |
| --- | --- | --- |
| Admin | `admin@example.com` | `password123` |
| Manager | `manager@example.com` | `password123` |
| Employee | `employee@example.com` | `password123` |

It also creates an active `FY 2026-27` cycle in the `GOAL_SETTING` phase.

## Scripts

```bash
npm run start:dev    # Start NestJS in watch mode
npm run start        # Start NestJS normally
npm run build        # Generate Prisma client and build the API
npm run start:prod   # Run compiled output from dist
npm run seed         # Seed demo data
npm run lint         # Run ESLint with auto-fix
npm run format       # Format src and test files
npm run test         # Run unit tests
npm run test:e2e     # Run e2e tests
npm run test:cov     # Run tests with coverage
```

## API Areas

All protected routes use `JwtAuthGuard`; role-sensitive routes also use `RolesGuard`.

| Module | Main Endpoints | Purpose |
| --- | --- | --- |
| Auth | `POST /auth/login` | Authenticate a user and return JWT plus profile details. |
| Goals | `/goals/*` | Create, update, submit, approve, return, unlock, and share goals. |
| Check-ins | `/checkins/*` | Log quarterly achievements, compute scores, update manager comments. |
| Users | `/users/*` | Admin user management and org hierarchy maintenance. |
| Cycles | `/cycles/*` | Create, activate, phase-shift, and reset performance cycles. |
| Reports | `/reports/export`, `/reports/completion` | CSV achievement export and completion dashboard data. |
| Audit | `GET /audit` | Latest audit log entries for admins. |

## Core Business Rules

- Goal creation is allowed only during the active cycle's `GOAL_SETTING` phase.
- Each employee can have at most 8 goals per active cycle.
- Individual goal weightage must be at least 10%.
- A submitted goal sheet must total exactly 100% weightage.
- Employees cannot edit approved or locked goal definitions.
- Managers can edit target and weightage before approval for direct reports.
- Approved goals are locked; admins can unlock for exceptions.
- Check-ins are blocked during goal setting and limited to the active quarter.
- Shared goals group linked employee goals under a `sharedGroupId`.
- Primary-owner check-ins on shared goals sync achievement updates to linked recipients.

## Progress Scoring

`CheckinsService` computes progress scores for tracking:

| UoM Type | Logic | Formula |
| --- | --- | --- |
| `NUMERIC` / `PERCENTAGE` | Higher is better | `achievement / target` |
| `NUMERIC` / `PERCENTAGE` with `isInverse` | Lower is better | `target / achievement` |
| `TIMELINE` | Deadline met | `1.0` if achievement date is on or before target date |
| `ZERO_BASED` | Zero is success | `1.0` if achievement is `0`, otherwise `0.0` |

Scores are clamped between `0` and `1`.

## Database Model

The Prisma schema defines:

- `User` with roles, manager relationship, direct reports, and audit logs.
- `Cycle` with active flag and phase.
- `Goal` with UoM, target, weightage, status, lock state, shared-goal metadata, and owner links.
- `GoalUpdate` with quarter, achievement, status update, comment, and computed progress score.
- `AuditLog` with actor, entity, action, old value, new value, and timestamp.

Enums:

- `Role`: `EMPLOYEE`, `MANAGER`, `ADMIN`
- `UomType`: `NUMERIC`, `PERCENTAGE`, `TIMELINE`, `ZERO_BASED`
- `GoalStatus`: `DRAFT`, `PENDING`, `APPROVED`, `RETURNED`, `COMPLETED`
- `CyclePhase`: `GOAL_SETTING`, `Q1_CHECKIN`, `Q2_CHECKIN`, `Q3_CHECKIN`, `Q4_CHECKIN`, `CLOSED`

## Deployment

The repository includes `goal-portal/render.yaml` for deploying this backend to Render:

- Root directory: `backend`
- Build command: `npm install --include=dev && npm run build`
- Start command: `npm run start:prod`
- Required env vars: `DATABASE_URL`, `DIRECT_URL`, `JWT_SECRET`, `FRONTEND_URL`

After deployment, point the frontend's `NEXT_PUBLIC_API_URL` to the deployed backend URL.
