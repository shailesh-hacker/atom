# Goal Management Portal — Frontend

A premium, enterprise-grade user interface built with Next.js 16 and Tailwind CSS. It provides a seamless experience for employees, managers, and admins to manage performance cycles and track organizational goals.

## ✨ High-Fidelity Features

- **Dynamic Goal Dashboard**: Visual progress tracking with real-time weightage calculation.
- **Contextual Slide-overs**: Elegant forms for goal assignment and editing that preserve user context.
- **Role-Switching Views**: Distinct dashboards for Employees (Check-ins), Managers (Team Review), and Admins (Governance).
- **Interactive Check-ins**: Quarterly logging interface with progress visualization and scoring feedback.
- **Audit Log Viewer**: High-fidelity view of system changes with highlighted data diffs.
- **Responsive Design**: Fully optimized for Desktop, Tablet, and Mobile devices.

## 🎨 Design System

The application uses a custom-tailored design system centered around **Indigo** and **Emerald** color palettes, focusing on:
- **Clarity**: High-contrast typography and status-aware color coding.
- **Feedback**: Instant toast notifications (Sonner) and visual validation states.
- **Aesthetics**: Glassmorphic UI elements, subtle gradients, and smooth Lucide icon transitions.

## 🛠️ Setup & Installation

### 1. Prerequisites
- Node.js (v18+)
- Backend running locally or reachable via URL

### 2. Environment Configuration
Create a `.env.local` file in the `frontend` directory:
```env
NEXT_PUBLIC_API_URL="http://localhost:3001"
```

### 3. Install Dependencies
```bash
npm install
```

### 4. Running the Application
```bash
# development
npm run dev

# production
npm run build
npm run start
```

## 📂 Project Structure

- **`/app`**: Next.js App Router containing all page routes grouped by role (e.g., `(employee)`, `(manager)`, `(admin)`).
- **`/components`**: Reusable UI atoms and complex feature-specific components.
- **`/hooks`**: Custom React hooks for data fetching and state logic (using TanStack Query).
- **`/lib`**: Utility functions, API client configuration, and Zod schemas.
- **`/styles`**: Global CSS and Tailwind configuration.
