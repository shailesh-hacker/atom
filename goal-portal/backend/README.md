# Goal Management Portal — Backend

The robust backend engine for the Goal Management Portal, built with NestJS, Prisma, and PostgreSQL. It handles secure authentication, role-based access control, complex performance calculations, and a high-fidelity audit trail.

## 🚀 Key Modules

- **Auth**: JWT-based authentication with Passport and secure password hashing.
- **Goals**: The core engine for CRUD operations, weightage validation, and manager-approval workflows.
- **Checkins**: Handles quarterly achievement logging with automated scoring formulas for different Units of Measure (UoM).
- **Cycles**: Manages performance windows (Goal Setting, Q1-Q4 Check-ins) and system phases.
- **Audit**: An interceptor-based logging system that captures all mutating actions with before/after snapshots.
- **Reports**: Data aggregation and CSV export engine for achievement and completion analytics.

## 🧮 Performance Scoring Engine

The backend automatically computes progress scores (0-100%) based on the following formulas:

| UoM Type | Logic | Formula |
|---|---|---|
| **Numeric / % (Min)** | Higher is better | Achievement / Target |
| **Numeric / % (Max)** | Lower is better | Target / Achievement |
| **Timeline** | Date completion | 100% if Achievement Date <= Target Date |
| **Zero-Based** | Zero = Success | 100% if Achievement is 0 |

## 🛠️ Setup & Installation

### 1. Prerequisites
- Node.js (v18+)
- PostgreSQL Database

### 2. Environment Configuration
Create a `.env` file in the `backend` directory:
```env
DATABASE_URL="postgresql://user:pass@host:5432/db"
JWT_SECRET="your_secure_secret_key"
```

### 3. Install Dependencies
```bash
npm install
```

### 4. Database Setup
```bash
npx prisma db push
# or
npx prisma migrate dev
```

### 5. Running the Server
```bash
# development
npm run start:dev

# production mode
npm run build
npm run start:prod
```

## 🏗️ Architecture

- **Controller-Service Pattern**: Clean separation of concerns.
- **Prisma ORM**: Type-safe database access and automated migrations.
- **Audit Interceptor**: Decoupled logging logic that preserves data integrity without slowing down the API.
- **Global Pipes**: Automated validation using `class-validator` and `class-transformer`.
