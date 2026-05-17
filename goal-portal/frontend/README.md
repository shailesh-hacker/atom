# GoalTrack Frontend

This is the Next.js frontend for GoalTrack, the in-house goal setting and tracking portal. It provides role-based workspaces for employees, managers, and admins, and communicates with the NestJS backend through the Axios API client in `lib/api.ts`.

## Tech Stack

- Next.js 16 App Router
- React 19
- TypeScript
- Tailwind CSS 4
- TanStack Query
- Axios
- React Hook Form and Zod
- Radix UI primitives
- Lucide React icons
- Recharts for analytics
- Sonner for toast notifications

## Current App Structure

```text
frontend/
+-- app/
|   +-- page.tsx                 # Role-based redirect after auth
|   +-- layout.tsx               # Root layout, providers, shell, navbar
|   +-- globals.css              # Tailwind and global theme styles
|   +-- (auth)/
|   |   +-- login/               # Login screen
|   +-- (employee)/
|   |   +-- goals/               # Employee goal sheet
|   |   +-- checkins/            # Employee quarterly check-ins
|   +-- (manager)/
|   |   +-- team/                # Team goals and shared goal assignment
|   |   +-- approvals/           # Manager approval workflow
|   |   +-- team-checkins/       # Planned vs actual review and comments
|   |   +-- team/analysis/       # Team QoQ analysis
|   +-- (admin)/
|       +-- users/               # User and hierarchy management
|       +-- cycles/              # Performance cycle management
|       +-- analysis/            # Organization analytics
|       +-- audit/               # Audit log viewer
|       +-- reports/             # CSV export and completion dashboard
+-- components/
|   +-- analytics/               # Charts and trend views
|   +-- checkins/                # Check-in modal
|   +-- goals/                   # Goal cards, forms, slide-over, weightage bar
|   +-- manager/                 # Manager-specific table components
|   +-- shared/                  # Shell, navbar, auth guard, badges, dialogs
|   +-- ui/                      # Reusable UI primitives
+-- hooks/
|   +-- useAuth.tsx              # Auth state and login/logout behavior
|   +-- useGoals.ts              # Goal data query hook
+-- lib/
    +-- api.ts                   # Axios client and JWT header injection
    +-- queryClient.ts           # TanStack Query client
    +-- utils.ts                 # Shared utility helpers
```

## Role-Based Experience

| Role | Main Routes | What the UI Supports |
| --- | --- | --- |
| Employee | `/goals`, `/checkins` | Create goal sheets, track weightage, submit for approval, log quarterly achievements. |
| Manager | `/team`, `/approvals`, `/team-checkins`, `/team/analysis`, `/reports` | Review team goals, edit target/weightage, approve or return goals, assign shared KPIs, add check-in comments, view team trends. |
| Admin | `/users`, `/cycles`, `/analysis`, `/audit`, `/reports` | Manage users and reporting lines, control cycles, review audit logs, export reports, monitor completion. |

The root route (`/`) redirects users after login based on their role.

## Environment Variables

Create `frontend/.env.local`:

```env
NEXT_PUBLIC_API_URL="http://localhost:3001"
```

The backend listens on port `3001` by default. The frontend API client falls back to `http://localhost:3000`, so this variable should be set during local development.

## Local Development

Install dependencies:

```bash
npm install
```

Start the development server:

```bash
npm run dev
```

Open:

```text
http://localhost:3000
```

Make sure the backend is running and reachable at `NEXT_PUBLIC_API_URL`.

## Scripts

```bash
npm run dev      # Start the Next.js dev server
npm run build    # Create a production build
npm run start    # Serve the production build
npm run lint     # Run ESLint
```

## Backend Integration

The frontend stores the JWT token in `localStorage` and attaches it to API requests with:

```text
Authorization: Bearer <token>
```

Core API areas used by the UI:

- `/auth/login`
- `/goals/*`
- `/checkins/*`
- `/users/*`
- `/cycles/*`
- `/reports/*`
- `/audit`

## Feature Coverage

- Goal sheet creation with UoM, target, weightage, inverse KPI support, and max-weightage feedback.
- Employee submission flow that requires a complete 100% goal sheet.
- Manager approval, return-for-rework, inline edit, and shared-goal assignment flows.
- Quarterly check-in screens that respect the active cycle phase.
- Planned vs actual views with backend-computed progress scores.
- Admin governance screens for users, cycles, reports, analysis, and audit logs.

## Notes

- Route access is guarded in `components/shared/AuthGuard.tsx`.
- Shared app chrome lives in `components/shared/AppShell.tsx` and `components/shared/Navbar.tsx`.
- The design tokens and global styles are concentrated in `app/globals.css`.
- Demo login accounts are seeded by the backend, not the frontend.
