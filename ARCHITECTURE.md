# JANRAKSHA AI — Architecture Documentation
**Team Paradise Force | Bihar Police Hackathon (PS-04)**
*Public Grievance Intelligence & Dispatch Command Platform*

---

## 1. Executive Summary

JANRAKSHA AI is a mission-grade civic grievance intelligence platform designed for district magistrates, municipal officers, police dispatchers, and departmental nodal authorities in Bihar. The system ingests public complaints (in both English and Hindi), analyzes semantic urgency, extracts geolocations, clusters duplicate reports around root incidents, and provides real-time operational dispatch and SLA monitoring.

---

## 2. High-Level System Architecture

```
                    ┌────────────────────────────────────────────────────────┐
                    │                   CITIZEN INPUTS                       │
                    │        (Web Portal / Helplines / Field Apps)           │
                    └──────────────────────────┬─────────────────────────────┘
                                               │
                                               ▼
                    ┌────────────────────────────────────────────────────────┐
                    │             JANRAKSHA AI FRONTEND (Vite+React)         │
                    │  • Midnight-Navy Command Center   • Geospatial Map     │
                    │  • Grievance Explorer             • Incident Clusters  │
                    │  • Department Operations          • Alerts & Trends    │
                    │  • Settings & Audit Trail                              │
                    └──────────────────────────┬─────────────────────────────┘
                                               │ HTTP / REST (Vite Proxy :5000)
                                               ▼
                    ┌────────────────────────────────────────────────────────┐
                    │           EXPRESS.JS BACKEND (Node.js + TypeScript)    │
                    │  ┌───────────────────────┐  ┌───────────────────────┐  │
                    │  │ Auth & RBAC Security  │  │ Zod Input Validation  │  │
                    │  └───────────────────────┘  └───────────────────────┘  │
                    │  ┌──────────────────────────────────────────────────┐  │
                    │  │            MODULAR AI ANALYSIS ENGINE            │  │
                    │  │  • NLP Category Classifier (Bilingual En/Hi)     │  │
                    │  │  • Sentiment & Urgency Scorer                    │  │
                    │  │  • Entity & Locality Extractor                   │  │
                    │  │  • Semantic Duplicate Detector & Clustering      │  │
                    │  │  • Dynamic Priority Recommender                  │  │
                    │  └──────────────────────────────────────────────────┘  │
                    │  ┌──────────────────────────────────────────────────┐  │
                    │  │ REST Controllers & Domain Services               │  │
                    │  │ Grievance | Metrics | Clusters | Alerts | Audit  │  │
                    │  └──────────────────────────────────────────────────┘  │
                    └──────────────────────────┬─────────────────────────────┘
                                               │
                                               ▼
                    ┌────────────────────────────────────────────────────────┐
                    │              DATA PERSISTENCE LAYER (Prisma ORM)       │
                    │  ┌─────────────────────────┐ ┌──────────────────────┐  │
                    │  │ Local Dev Fallback:     │ │ Production Option:   │  │
                    │  │ SQLite (Zero-Setup)     │ │ PostgreSQL 15+       │  │
                    │  │ `prisma/dev.db`         │ │ (Swappable schema)   │  │
                    │  └─────────────────────────┘ └──────────────────────┘  │
                    └────────────────────────────────────────────────────────┘
```

---

## 3. Technology Stack & Decision Rationale

| Layer | Technology | Decision Rationale |
|---|---|---|
| **Frontend Framework** | React 18 + TypeScript + Vite | Ultra-fast HMR, type safety, modular component lifecycle. |
| **Styling & Theme** | Tailwind CSS + Lucide Icons | Deep midnight-navy palette (`#0B0F19`, `#0F172A`), electric blue and cyan accents, alert status tokens, zero CSS runtime overhead. |
| **Charts & Metrics** | Recharts | Composable SVG-based visualizations with responsive containers, dark-mode tooltips, and smooth animations. |
| **Geospatial Mapping** | Leaflet + OpenStreetMap | Lightweight, open-source cartography with custom HTML/SVG glowing markers, bounding-box clustering, and zero external API key lock-in. |
| **Backend Framework** | Node.js + Express + TypeScript | High-throughput asynchronous I/O, enterprise-grade typing, clear routing, and controller decoupling. |
| **Validation** | Zod | Runtime type inference, strict schema validation for all ingress request bodies and query parameters. |
| **ORM & DB** | Prisma ORM (SQLite / PostgreSQL) | Strongly-typed client queries, declarative migrations, seed predictability. Local development runs on zero-dependency SQLite; production can swap provider to `postgresql` via single config change. |
| **Testing** | Vitest + Supertest | Blazing fast in-memory execution, end-to-end API integration tests, and unit verification for the AI engine. |

---

## 4. Database Schema & Data Models

1. **User**: System officials (Super Admin, District Magistrate, Department Officer, Field Investigator) with password hashing and departmental bindings.
2. **Department**: Civic branches (Road Construction, Water & Sanitation, Electricity/Power, Solid Waste Management, Law & Order, Health & Drainage).
3. **Grievance**: The core entity with tracking code (`JAN-XXXX-XXXX`), complainant info, category, description, status lifecycle (`OPEN` -> `ASSIGNED` -> `IN_PROGRESS` -> `VERIFICATION` -> `RESOLVED`), and severity (`LOW`, `MEDIUM`, `HIGH`, `CRITICAL`).
4. **Location**: Lat/long coordinates, district, locality/ward, landmark, and automated location confidence score (0.0 to 1.0).
5. **AIAnalysis**: Extracted metadata, sentiment score (-1.0 to +1.0), urgency score (1-10), extracted entities, duplicate similarity rating, and classification confidence.
6. **IncidentCluster**: Grouping multiple grievances originating from the same physical disruption (e.g., burst water main, flooded underpass, transformer explosion).
7. **AssignmentHistory & Note**: Audit-backed officer assignments and internal departmental notes.
8. **AuditLog**: Immutable append-only log of all system transitions, capturing `action`, `actorId`, `entityType`, `oldValues`, and `newValues`.
9. **Alert**: High-priority notifications triggered by SLA breaches, anomaly spikes, or critical danger keywords.

---

## 5. Modular AI Architecture (Phase 1 vs. Phase 2)

The `AIAnalysisEngine` is implemented as an interface-driven service (`IAIAnalysisService`) to ensure zero-friction upgradeability:

```typescript
export interface IAIAnalysisResult {
  category: GrievanceCategory;
  categoryConfidence: number;
  priority: PriorityLevel;
  priorityReason: string;
  sentiment: 'Frustrated' | 'Urgent' | 'Neutral' | 'Distressed';
  urgencyScore: number; // 1-10
  entities: {
    locations: string[];
    district?: string;
    landmarks: string[];
    keywords: string[];
  };
  duplicateCheck: {
    isPotentialDuplicate: boolean;
    clusterCandidateId?: string;
    similarityScore: number;
    matchReason?: string;
  };
  analysisMode: 'DEMO_RULE_BASED' | 'PRODUCTION_TRANSFORMER';
}
```

- **Phase 1 (Current)**: High-precision deterministic lexicon, bilingual pattern matcher (Hindi & English), Jaccard & Levenshtein coordinate-proximity duplicate grouping, and severity escalation rules. Clearly stamped in the UI as **"DEMO ANALYSIS ENGINE"**.
- **Phase 2 (Future Extension)**: Drop-in replacement with fine-tuned multilingual IndicBERT / Llama-3-8B endpoints or Python FastAPI sidecar without altering database schemas or API contracts.

---

## 6. Local Development Fallback Strategy

To avoid environment failures where PostgreSQL is not locally installed on the host machine, the repository default is set to Prisma with **SQLite (`file:./dev.db`)**.
- The schema is written using standard SQL-compatible scalar types.
- To switch to PostgreSQL:
  1. Set `DATABASE_URL="postgresql://user:pass@host:5432/janraksha?schema=public"` in `.env`.
  2. Change `provider = "sqlite"` to `provider = "postgresql"` in `prisma/schema.prisma`.
  3. Run `npx prisma migrate dev --name init`.
