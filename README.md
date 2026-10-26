# JANRAKSHA AI — Public Grievance Intelligence & Dispatch Command Platform
**Bihar Police Hackathon | Problem Statement PS-04**
**Team:** Paradise Force

[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=flat-square&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-20232A?style=flat-square&logo=react&logoColor=61DAFB)](https://reactjs.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=flat-square&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![Node.js](https://img.shields.io/badge/Node.js-43853D?style=flat-square&logo=node.js&logoColor=white)](https://nodejs.org/)
[![Express.js](https://img.shields.io/badge/Express.js-404D59?style=flat-square)](https://expressjs.com/)
[![Prisma](https://img.shields.io/badge/Prisma-3982CE?style=flat-square&logo=Prisma&logoColor=white)](https://www.prisma.io/)
[![Leaflet](https://img.shields.io/badge/Leaflet-199900?style=flat-square&logo=Leaflet&logoColor=white)](https://leafletjs.com/)

---

## 📌 Mission

**JANRAKSHA AI** is a mission-grade command-and-control civic intelligence platform developed for the Bihar Police Hackathon (PS-04). It empowers authorized law enforcement, municipal executives, and departmental nodal officers to triage, cluster, prioritize, and dispatch public grievances across districts in real time.

---

## ⚡ Core Capabilities

- **Midnight-Navy Command Center**: High-density operational dashboard featuring real-time KPIs, intake vs. resolution trends, severity breakdown, and department workloads.
- **Bilingual Grievance Intelligence (En / Hi)**: Real-time processing of citizen complaints in English and Hindi (e.g. automatically identifying *जलजमाव*, *ट्रांसफार्मर स्पार्क*, *कचरा*, *सड़क गड्ढा*).
- **Incident Clustering & Duplicate Detection**: Automatically links multiple grievances reporting the same physical disruption to prevent redundant resource dispatch.
- **Interactive Geospatial Map**: Leaflet & OpenStreetMap integration with severity-coded glowing markers, radius clusters, and direct case-drawer inspection.
- **Department Dispatch & SLA Tracking**: Direct case reassignment, official notes, status progression (`OPEN` ➔ `ASSIGNED` ➔ `IN_PROGRESS` ➔ `VERIFICATION` ➔ `RESOLVED`), and resolution auditing.
- **Role-Based Command Matrix**: Switch seamlessly between Super Admin, District Magistrate, Department Officer, and Field Investigator personas.
- **Immutable Audit Trail**: Consequential updates logged with actor, timestamp, previous value, and new state.

---

## 🛠 Tech Stack

- **Frontend**: React 18, TypeScript, Vite, Tailwind CSS, Lucide Icons, Recharts, Leaflet.
- **Backend**: Node.js, Express, TypeScript, Zod schema validation.
- **Database**: Prisma ORM with SQLite local zero-setup fallback (switchable to PostgreSQL).
- **Testing**: Vitest, Supertest for API integration testing.

---

## 🚀 Quick Startup Guide

### Prerequisites
- Node.js (v18+ or v20+ / v24+)
- npm (v9+)

### 1. Installation
Install all root, backend, and frontend dependencies:
```bash
npm run install:all
```

### 2. Database Setup & Seeding
Initialize the database and load comprehensive synthetic demo data (districts, departments, bilingual grievances, clusters, audit logs):
```bash
npm run db:setup
npm run db:seed
```

### 3. Launch Development Environment
Run both backend (`http://localhost:5000`) and frontend (`http://localhost:5173`) concurrently:
```bash
npm run dev
```

Visit **`http://localhost:5173`** in your browser.

---

## 🧪 Testing

Run backend API and AI unit tests:
```bash
npm run test
```

---

## 📁 Repository Structure

```
├── ARCHITECTURE.md          # Comprehensive architecture & design document
├── SECURITY.md              # Security model, RBAC matrix, and audit specs
├── .env.example             # Example environment variables
├── package.json             # Root monorepo orchestration scripts
├── backend/
│   ├── prisma/
│   │   ├── schema.prisma    # Prisma schema definition
│   │   └── seed.ts          # Comprehensive synthetic data seed script
│   ├── src/
│   │   ├── server.ts        # Express entry point
│   │   ├── app.ts           # App middleware & router wiring
│   │   ├── controllers/     # Route handlers (Grievance, Metrics, Clusters, etc.)
│   │   ├── services/        # AI Analysis Engine, Grievance Service, Audit Service
│   │   ├── middleware/      # Auth, RBAC, Zod validation, Error handlers
│   │   └── routes/          # API route definitions
│   └── tests/               # Vitest API and unit tests
└── frontend/
    ├── src/
    │   ├── components/      # UI components (CommandCenter, Map, Explorer, etc.)
    │   ├── context/         # Auth, Notifications, and Filter state
    │   ├── services/        # API client
    │   └── types/           # TypeScript domain interfaces
    ├── tailwind.config.js   # Midnight-navy & cyber-blue design tokens
    └── vite.config.ts       # Vite configuration with proxy to backend
```
