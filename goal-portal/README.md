# Goal Setting & Tracking Portal

An enterprise-grade platform designed to replace manual goal tracking with a structured, automated workflow. The portal allows employees to set quarterly goals, managers to review and approve them, and administrators to govern the entire cycle through a premium, high-fidelity interface.

## 🚀 Tech Stack

| Layer | Technology |
|---|---|
| **Frontend** | Next.js 16 (App Router), Tailwind CSS v4, Lucide React, Sonner |
| **Backend** | NestJS, Passport JWT, RBAC |
| **Database** | PostgreSQL (Supabase), Prisma ORM |
| **Forms** | React Hook Form + Zod |
| **State Management** | TanStack Query (Frontend) |

---

## ✨ Key Features

### 🔐 Authentication & Security
- **JWT-based Auth**: Secure login with protected routes.
- **Role-Based Access Control (RBAC)**: Distinct permissions for `EMPLOYEE`, `MANAGER`, and `ADMIN`.
- **Audit Interceptors**: Automatic backend logging of all sensitive data modifications.

### 🎯 Goal Management (Employee)
- **High-Fidelity Goal Sheet**: Visual dashboard with real-time status tracking.
- **Weightage Meter**: Dynamic circular progress tracking total goal weightage.
- **Premium Slide-over Form**: Context-aware goal creation with Unit of Measure (UoM) specific fields.
- **Business Logic Enforcement**: 
  - Maximum 8 goals per cycle.
  - Strict 100% total weightage requirement for submission.
  - Automatic goal locking after approval.
- **Weightage Bar**: Visual breakdown of goal distribution across organizational thrust areas.

### 👥 Team Dashboard (Manager)
- **Summary Stat Cards**: Real-time overview of team size, goal counts, and approval status.
- **Expandable Team Table**: Inline goal review for all direct reports.
- **Approval Workflow**: Bulk approve all goals or return specific goals for rework with comments.
- **Check-in Review**: Monitor quarterly progress with color-coded performance scores.

### ⚙️ Governance & Administration (Admin)
- **User Management**: Table and Org Tree views for managing reporting lines and roles.
- **Cycle Management**: Visual timeline for goal-setting phases and check-in windows.
- **Unlock Capability**: Admin-only tool to unlock goals for emergency edits (fully audited).
- **Audit Logs**: Deep inspection of all system actions with JSON-diff view of data changes.
- **Reporting Engine**: Preview and export Achievement, Completion, and Distribution reports as CSV.

---

## 🎨 Design System: "GoalTrack Enterprise"
Built for a premium, professional user experience:
- **Palette**: Indigo (Brand), Emerald (Success), Amber (Warning), Rose (Danger).
- **Typography**: Inter (Systematic weight hierarchy).
- **UX Patterns**: Right-side slide-overs for context preservation, centered modals for focus, and skeleton loaders for smooth transitions.
- **Components**: Glassmorphic surfaces, subtle micro-animations, and responsive layouts (Mobile/Tablet/Desktop).

---

## 🛠️ Getting Started

### Backend
1. `cd backend`
2. `npm install`
3. Configure `.env` (DATABASE_URL, JWT_SECRET)
4. `npx prisma migrate dev`
5. `npm run start:dev`

### Frontend
1. `cd frontend`
2. `npm install`
3. Configure `.env` (NEXT_PUBLIC_API_URL)
4. `npm run dev`

---

## 📁 Directory Structure
```
goal-portal/
├── frontend/             # Next.js App
│   ├── app/              # App Router Pages
│   ├── components/       # Design System & UI
│   └── lib/              # Utilities & API
└── backend/              # NestJS Server
    ├── src/              # Modules & Controllers
    └── prisma/           # Database Schema
```
