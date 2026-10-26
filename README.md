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
[![Vitest](https://img.shields.io/badge/Vitest-6E9F18?style=flat-square&logo=vitest&logoColor=white)](https://vitest.dev/)

---

## 📌 Mission

**JANRAKSHA AI** is a mission-grade command-and-control civic intelligence platform developed for the Bihar Police Hackathon (PS-04). It empowers authorized law enforcement, municipal executives, and departmental nodal officers to triage, cluster, prioritize, and dispatch public grievances across districts in real time.

---

## ⚡ Core Capabilities & Intelligence Engine (Phase 1 & Phase 2)

- **8-Stage Intelligence Pipeline**: Every grievance moves through a transparent, testable 8-stage sequence:
  $$\text{INGEST} \rightarrow \text{NORMALISE} \rightarrow \text{CLASSIFY} \rightarrow \text{EXTRACT} \rightarrow \text{MATCH} \rightarrow \text{SCORE} \rightarrow \text{ROUTE} \rightarrow \text{ALERT}$$
- **Full Analytical Provenance**: Every output explicitly identifies its method, execution timestamp, duration (ms), confidence score, and provenance tag (`REAL_LOCAL_MODEL`, `DETERMINISTIC_RULES`, or `DEMO_RULE_BASED`).
- **Bilingual Grievance Classification (En / Hi)**:
  - Local TF-IDF Cosine vector model on civic prototypes.
  - Devanagari script detection (`[\u0900-\u097F]`), Hindi phonetic normalization (*ट्रांसफार्मर*, *गड्ढा*, *जलजमाव*), and stopword filtering.
  - Transparent rule-based fallback for unsupported languages or low confidence.
- **Multi-Factor Duplicate & Clustering Engine**:
  - Detects duplicate candidates via: Text Similarity (30%), Category Agreement (25%), Haversine Geo Proximity (30%), and Time-Window Overlap (15%).
  - Exposes complete evidence breakdown for every match.
  - **Human-in-the-Loop Review**: Officials confirm or reject matches, merging related reports into root incidents without ever deleting or mutating original citizen complaints.
- **Explainable 6-Factor Priority Scoring**:
  - Base Hazard (0–30) + Corroborated Volume (0–25) + Recurrence Velocity (0–15) + SLA Aging (0–15) + Geo Spread (0–10) + Evidence Quality (0–5).
  - Strictly decouples social media viral popularity from actual public harm.
  - **Official Priority Override**: Authorized officials can override AI recommendations by recording a mandatory justification in the immutable audit trail.
- **Department Routing Engine**:
  - Recommends statutory Bihar administrative departments based on category and jurisdiction (RWD, MCD, BSPHCL, PHED, BHP).
  - Explicitly mandates human officer confirmation prior to dispatch.
- **Automated Threshold Alert Engine**:
  - Emits alerts for critical safety hazards (`CRITICAL_SAFETY`), expanding clusters (`CLUSTER_GROWTH`), localized complaint hotspots (`AREA_HOTSPOT`), SLA breaches (`OVERDUE_SLA`), and sudden district surges (`DISTRICT_SURGE`).
- **Midnight-Navy Command Center & Interactive Map**:
  - Real-time KPIs, intake vs. resolution analytics, Leaflet geospatial map with glowing severity markers, and case inspection drawers.
- **Role-Based Command Matrix & Audit Trail**:
  - Personas: Super Admin, District Magistrate, Department Officer, Field Investigator.
  - Immutable audit logs capture actor, timestamp, previous values, and new state.

---

## 🧠 Phase 3: Real AI & Multimodal Intelligence

### 1. Real NLP & Model Adapter Architecture
- **Adapter Interface (`INLPModelAdapter`)**: Located in `backend/src/services/ai/types.ts`. Provides structured output schemas with strict validation.
- **Local Bilingual Adapter (`LocalRuleAdapter`)**: Default zero-setup model (`janraksha-bilingual-v3.2`) with TF-IDF cosine vector matching, Devanagari keyword extractors, and rule-based sentiment polarity.
- **Configurable External Provider (`ExternalAIProviderAdapter`)**: Ready-to-use adapter supporting OpenAI, Gemini, or Ollama via `AI_PROVIDER=gemini` or `AI_PROVIDER=openai` and `AI_API_KEY`.
- **Structured Output**: Validates category, confidence, sentiment score (-1.0 to 1.0), urgency score (1-10), extracted entities (locations, landmarks, keywords), model provider, version, and latency.

### 2. Image and Video Intelligence
- **Visual Model Adapter (`VisionModelAdapter`)**: Classifies civic infrastructure issues from photos and videos (surface asphalt craters, stormwater accumulation, live wires, illegal dumping, missing manhole covers).
- **Video Keyframe Extraction**: Samples representative frames (start, midpoint, end) to analyze video evidence without heavy compute overhead.
- **Model Observations vs. Official Verification**: Case details distinguish model-detected bounding boxes and predictions from human officer verification.

### 3. Social-Source Ingestion & Connectors
- **Connector States**: Real-time connector dashboard in the Incident Intelligence view showing operational state (`ACTIVE`, `STANDBY`, `DISCONNECTED`).
- **Supported Channels**:
  - Official X (formerly Twitter) tag ingestion adapter.
  - Bihar State Grievance Portal RSS/JSON feed reader.
  - WhatsApp Helpline Webhook Gateway.
  - **CSV & JSON Fallback**: Drag-and-drop batch ingestion with schema validation and duplicate prevention.

### 4. Geospatial Intelligence & Provenance
- **Provenance Tracking**: Every location is assigned a provenance label:
  - `GPS_EXACT`: Precise coordinates provided by mobile device.
  - `LOCALITY_CENTROID`: Geocoded against Bihar landmark/ward database.
  - `DISTRICT_CENTROID`: Centroid of administrative district.
  - `UNRESOLVED`: Preserves unmapped or missing location without inventing fake coordinates.
- **Map Filtering**: Dynamic Leaflet map filters by district, severity, and status.

### 5. Privacy, Redaction & Resilience
- **Automated PII Redaction (`PrivacyService`)**: Regex-based scrubbing of Indian phone numbers (`+91 / 10-digit`), 12-digit Aadhaar numbers, and email addresses.
- **Role-Based Display**: Complainant identities are masked for non-authorized personnel; anonymous submissions withhold all personal identifiers.
- **Upload Resilience**: 50MB maximum payload limit, MIME-type whitelist (JPEG, PNG, WebP, MP4, WebM, CSV, JSON), UUID file names, and safe error boundaries.

### 6. Synthetic Benchmark & Evaluation
- **Gold-Standard Dataset (`GOLD_STANDARD_BENCHMARK_SET`)**: 24 curated test cases with ground-truth categories, sentiment, and district labels across English, Hindi, and code-mixed formats.
- **Live Benchmarking Endpoint**: `GET /api/v1/evaluation/benchmark` computes precision, recall, F1-scores, language-specific accuracy, and latency distributions.
- **Honest Limitations Disclosure**: Transparently reports lower recall for non-standardized rural dialects (e.g., Magahi, Angika) and landmark gazetteer boundaries.

---

## 🛠 Tech Stack

- **Frontend**: React 18, TypeScript, Vite, Tailwind CSS, Lucide Icons, Recharts, Leaflet.
- **Backend**: Node.js, Express, TypeScript, Zod schema validation.
- **Database**: Prisma ORM with SQLite local zero-setup fallback (switchable to PostgreSQL).
- **Testing**: Vitest, Supertest for API and pipeline verification (21 test suites).

---

## 🚀 Quick Startup Guide

### Prerequisites
- Node.js (v18+, v20+, or v24+)
- npm (v9+)

### 1. Installation
Install all root, backend, and frontend dependencies:
```bash
npm run install:all
```

### 2. Database Setup & Seeding
Initialize the database and load comprehensive synthetic demo data:
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

## 🧪 Testing & Verification

Run the full Vitest suite:
```bash
npm test
```

Build verification (Frontend Vite + Backend TypeScript):
```bash
npm run build
```

Run Phase 3 AI Evaluation Benchmark:
```bash
npx tsx -e "import { benchmarkService } from './backend/src/services/evaluation/benchmarkService'; benchmarkService.runEvaluation().then(res => console.log('Accuracy:', res.overallAccuracyPercent + '%'));"
```

---

## ⚙️ Environment Variables & Configuration

Configure in `backend/.env`:

```env
PORT=5000
NODE_ENV=development
API_PREFIX=/api/v1
CORS_ORIGIN=http://localhost:5173
DATABASE_URL="file:./dev.db"
JWT_SECRET="janraksha_dev_secret_key_change_in_production_min_32_chars"

# Optional External AI Provider (defaults to zero-cost local bilingual model if omitted)
AI_PROVIDER=local        # Options: local | gemini | openai
AI_API_KEY=""            # Cloud API key if using gemini or openai
AI_MODEL_NAME=""         # e.g., gemini-1.5-flash or gpt-4o-mini

# Social Ingestion Connectors (optional)
X_API_BEARER_TOKEN=""
BIHAR_RSS_FEED_URL="https://state.bihar.gov.in/feed/civic.json"
```

---

## 📁 Repository Structure

```
├── ARCHITECTURE.md          # Comprehensive architecture & pipeline specs
├── SECURITY.md              # Security model, RBAC matrix, and audit specs
├── .env.example             # Example environment variables
├── package.json             # Root monorepo orchestration scripts
├── backend/
│   ├── prisma/
│   │   ├── schema.prisma    # Prisma schema (Grievance, DuplicateCandidate, Cluster, etc.)
│   │   └── seed.ts          # Comprehensive synthetic data seed script
│   ├── src/
│   │   ├── server.ts        # Express entry point
│   │   ├── app.ts           # App middleware & router wiring
│   │   ├── pipeline/        # 8-Stage Intelligence Pipeline
│   │   ├── controllers/     # Route handlers (Grievance, Duplicate, Cluster, Dept, Alert, Ingestion, Evaluation)
│   │   ├── services/
│   │   │   ├── ai/          # Real NLP & Vision Adapters (Local, External, Factory)
│   │   │   ├── evaluation/  # Golden benchmark dataset and evaluation metrics
│   │   │   ├── geospatial/  # Geocoding service with provenance tracking
│   │   │   ├── ingestion/   # Social connectors and CSV/JSON fallback importer
│   │   │   ├── privacy/     # PII redaction and role sanitization
│   │   │   └── grievance.service.ts # Core business logic
│   │   ├── middleware/      # Auth, RBAC, Multer upload, Error handlers
│   │   └── routes/          # API route definitions
│   └── tests/               # Vitest unit and integration tests
└── frontend/
    ├── src/
    │   ├── components/
    │   │   ├── views/       # CommandCenter, GrievanceExplorer, IncidentIntelligence, GeospatialMap
    │   │   ├── grievance/   # CaseDetailDrawer (with Multimodal Inspector), CreateGrievanceModal
    │   │   └── layout/      # Sidebar, TopNav
    │   ├── context/         # AppContext state management
    │   ├── services/        # API client
    │   └── types/           # TypeScript interfaces
```
