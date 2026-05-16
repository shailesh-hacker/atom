# 🎯 Goal Management & Tracking Portal

[![Next.js](https://img.shields.io/badge/Frontend-Next.js%2016-black?style=flat-square&logo=next.js)](https://nextjs.org/)
[![NestJS](https://img.shields.io/badge/Backend-NestJS-red?style=flat-square&logo=nestjs)](https://nestjs.com/)
[![Prisma](https://img.shields.io/badge/ORM-Prisma-blue?style=flat-square&logo=prisma)](https://www.prisma.io/)
[![Tailwind CSS](https://img.shields.io/badge/Styling-Tailwind%20CSS%20v4-38B2AC?style=flat-square&logo=tailwind-css)](https://tailwindcss.com/)

A high-fidelity, enterprise-grade platform designed to streamline organizational performance management. This portal replaces manual spreadsheets with a structured, automated workflow for goal creation, manager approval, and quarterly achievement tracking.

---

## 📂 Project Structure

This project is organized into two primary modules:

- **[Backend (NestJS)](./backend)**: A secure RESTful API handling business logic, scoring formulas, and audit logging.
- **[Frontend (Next.js)](./frontend)**: A premium, responsive dashboard for employees, managers, and admins.

---

## ✨ Key Capabilities

### 🏢 Governance & Compliance
- **Cycle Management**: Orchestrate goal-setting windows and quarterly check-in phases.
- **Audit Interceptors**: Every data modification is logged with a detailed snapshot of changes (who, what, when).
- **Unlock Authority**: Admins can override goal locks for emergency edits, maintaining a full audit trail.

### 📈 Performance Engineering
- **Advanced Scoring**: Automatic progress calculation for Numeric, Percentage, Timeline, and Zero-based goals.
- **Inverse Logic**: Specialized support for "lower-is-better" KPIs (e.g., Cost reduction, TAT).
- **Shared KPI Push**: Managers can push departmental goals to multiple employees with real-time achievement synchronization.

### 🎨 Premium User Experience
- **Contextual Workflows**: Slide-over forms and centered modals ensure users never lose their place.
- **Visual Analytics**: Dynamic weightage bars, circular progress meters, and color-coded status indicators.
- **Mobile-First Design**: Fully responsive layouts optimized for modern workplace devices.

---

## 🛠️ Quick Start

### 1. Backend Setup
```bash
cd backend
npm install
# Configure .env with DATABASE_URL
npx prisma db push
npm run start:dev
```

### 2. Frontend Setup
```bash
cd frontend
npm install
# Configure .env.local with NEXT_PUBLIC_API_URL
npm run dev
```

---

## 🔐 User Personas

| Role | Responsibility |
|---|---|
| **Employee** | Draft goal sheets, log quarterly achievements, and track personal progress. |
| **Manager** | Review team goals, edit targets inline, and conduct quarterly check-ins with feedback. |
| **Admin** | Configure performance cycles, manage org hierarchy, and oversee completion rates. |

---

## 📜 License
Internal Enterprise Use. Built with ❤️ for optimized performance management.

