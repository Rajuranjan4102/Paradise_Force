# JANRAKSHA AI — Architecture Documentation
**Team Paradise Force | Bihar Police Hackathon (PS-04)**
*Public Grievance Intelligence & Dispatch Command Platform*

---

## 1. Executive Summary

JANRAKSHA AI is a mission-grade civic grievance intelligence platform designed for district magistrates, municipal officers, police dispatchers, and departmental nodal authorities in Bihar. The platform ingests public grievances (in both English and Hindi), executes a transparent 8-stage intelligence pipeline, clusters related reports into root incidents, calculates explainable priority scores, recommends statutory department routing, and alerts commanders to emerging public safety hotspots.

Every analytical output carries provenance metadata detailing its method, timestamp, confidence, and execution mode (`REAL_LOCAL_MODEL`, `DETERMINISTIC_RULES`, or `DEMO_RULE_BASED`).

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
                    │  • Candidate Duplicate Review     • 8-Stage Pipeline   │
                    │  • Priority Override Controls     • Department Ops     │
                    │  • Settings & Audit Trail                              │
                    └──────────────────────────┬─────────────────────────────┘
                                               │ HTTP / REST (Vite Proxy :5000)
                                               ▼
                    ┌────────────────────────────────────────────────────────┐
                    │           EXPRESS.JS BACKEND (Node.js + TypeScript)    │
                    │  ┌───────────────────────┐  ┌───────────────────────┐  │
                    │  │ Auth & RBAC Security  │  │ Zod Input Validation  │  │
                    │  └───────────────────────┘  └───────────────────────┘  │
                    │                                                        │
                    │  ┌──────────────────────────────────────────────────┐  │
                    │  │       8-STAGE GRIEVANCE INTELLIGENCE PIPELINE    │  │
                    │  │  1. INGEST    → Sanitization & Boundary Checks   │  │
                    │  │  2. NORMALISE → Unicode NFC & Hindi Tokens       │  │
                    │  │  3. CLASSIFY  → TF-IDF Cosine Model (Bilingual)  │  │
                    │  │  4. EXTRACT   → Locality & Landmark NER          │  │
                    │  │  5. MATCH     → Multi-Factor Duplicate Engine    │  │
                    │  │  6. SCORE     → Explainable 6-Factor Priority    │  │
                    │  │  7. ROUTE     → Category-to-Dept Routing         │  │
                    │  │  8. ALERT     → Threshold Anomaly Generator      │  │
                    │  └──────────────────────────────────────────────────┘  │
                    │                                                        │
                    │  ┌──────────────────────────────────────────────────┐  │
                    │  │ REST Controllers & Domain Services               │  │
                    │  │ Grievance | Duplicates | Clusters | Alerts | RBAC│  │
                    │  └──────────────────────────────────────────────────┘  │
                    └──────────────────────────┬─────────────────────────────┘
                                               │
                                               ▼
                    ┌────────────────────────────────────────────────────────┐
                    │              DATA PERSISTENCE LAYER (Prisma ORM)       │
                    │  ┌─────────────────────────┐ ┌──────────────────────┐  │
                    │  │ Local Dev Fallback:     │ │ Production Option:   │  │
                    │  │ SQLite (Zero-Setup)     │ │ PostgreSQL 15+       │  │
                    │  │ `backend/prisma/dev.db` │ │ (Swappable schema)   │  │
                    │  └─────────────────────────┘ └──────────────────────┘  │
                    └────────────────────────────────────────────────────────┘
```

---

## 3. Technology Stack & Decision Rationale

| Layer | Technology | Decision Rationale |
|---|---|---|
| **Frontend Framework** | React 18 + TypeScript + Vite | Blazing HMR, strict type safety, modular component lifecycle. |
| **Styling & Theme** | Tailwind CSS + Lucide Icons | Deep midnight-navy palette (`#0B0F19`, `#0F172A`), electric blue and cyan accents, alert status tokens, zero CSS runtime overhead. |
| **Charts & Metrics** | Recharts | Composable SVG-based visualizations with responsive containers, dark-mode tooltips, and smooth animations. |
| **Geospatial Mapping** | Leaflet + OpenStreetMap | Lightweight, open-source cartography with custom HTML/SVG glowing markers, bounding-box clustering, and zero external API key lock-in. |
| **Backend Framework** | Node.js + Express + TypeScript | High-throughput asynchronous I/O, enterprise-grade typing, clear routing, and controller decoupling. |
| **Validation** | Zod | Runtime type inference, strict schema validation for all ingress request bodies and query parameters. |
| **Intelligence Pipeline** | Custom Local NLP & Scoring Engine | Zero-dependency, locally runnable TF-IDF Cosine vectorizer with bilingual prototypes (En/Hi), deterministic fallbacks, and provenance tagging. |
| **ORM & DB** | Prisma ORM (SQLite / PostgreSQL) | Strongly-typed client queries, declarative migrations, seed predictability. Local development runs on zero-dependency SQLite; production can swap provider to `postgresql` via single config change. |
| **Testing** | Vitest + Supertest | In-memory execution, end-to-end API integration tests, and unit verification for all 8 pipeline stages and edge cases. |

---

## 4. Database Schema & Data Models

1. **User**: System officials (Super Admin, District Magistrate, Department Officer, Field Investigator) with password hashing, role permissions, and departmental bindings.
2. **Department**: Civic branches (Road Construction, Water & Sanitation, Electricity/Power, Solid Waste Management, Law & Order, Health & Drainage).
3. **Grievance**: The core entity with tracking code (`JAN-XXXX-XXXX`), complainant info, category, description, status lifecycle (`OPEN` -> `ASSIGNED` -> `IN_PROGRESS` -> `VERIFICATION` -> `RESOLVED`), severity (`LOW`, `MEDIUM`, `HIGH`, `CRITICAL`), and priority override audit fields (`priorityOverridden`, `priorityOverrideReason`, `priorityOverriddenBy`).
4. **Location**: Lat/long coordinates, district, locality/ward, landmark, and automated location confidence score (0.0 to 1.0).
5. **AIAnalysis**: Extracted metadata, sentiment score (-1.0 to +1.0), urgency score (1-10), extracted entities, duplicate similarity rating, classification confidence, engine mode (`REAL_LOCAL_MODEL`, `DETERMINISTIC_RULES`, `DEMO_RULE_BASED`), and full 8-stage `pipelineMetaJson`.
6. **IncidentCluster**: Grouping multiple grievances originating from the same physical disruption (e.g., burst water main, flooded underpass, transformer explosion), with centroid coordinates and status tracking.
7. **DuplicateCandidate**: Auditable relationship linking candidate reports with similarity score, multi-factor evidence JSON, status (`PENDING`, `CONFIRMED`, `REJECTED`), reviewing officer ID, and review timestamp.
8. **AssignmentHistory & Note**: Audit-backed officer assignments and internal departmental observations.
9. **AuditLog**: Immutable append-only log of all system transitions, capturing `action`, `actorId`, `entityType`, `oldValues`, and `newValues`.
10. **Alert**: High-priority notifications triggered by SLA breaches, anomaly spikes, or critical danger keywords.

---

## 5. Phase 2: 8-Stage Grievance Intelligence Pipeline

The pipeline runs sequentially for each ingested complaint:

```
[INGEST] ➔ [NORMALISE] ➔ [CLASSIFY] ➔ [EXTRACT] ➔ [MATCH] ➔ [SCORE] ➔ [ROUTE] ➔ [ALERT]
```

Every stage produces a standardized telemetry record:
```typescript
export interface StageTelemetry {
  stage: 'INGEST' | 'NORMALISE' | 'CLASSIFY' | 'EXTRACT' | 'MATCH' | 'SCORE' | 'ROUTE' | 'ALERT';
  method: 'REAL_LOCAL_MODEL' | 'DETERMINISTIC_RULES' | 'DEMO_RULE_BASED';
  durationMs: number;
  timestamp: string;
  confidence?: number;
  details?: Record<string, unknown>;
}
```

### Stage 1: INGEST
- Performs strict boundary and schema validation using Zod.
- Checks coordinate boundaries within Bihar's geospatial bounding box (`24.0°N – 28.0°N`, `83.0°E – 89.0°E`).
- Strips malformed characters and standardizes inputs.

### Stage 2: NORMALISE
- Normalizes text into Unicode NFC form.
- Detects language using script detection:
  - Devanagari range `[\u0900-\u097F]` ➔ Hindi (`hi`)
  - Latin character range ➔ English (`en`)
  - Other scripts ➔ Gracefully flagged as `unsupported`
- Performs Hindi phonetic standardization (e.g., normalizes *ट्रांसफारमर*, *ट्रांसफार्मर*).
- Filters English and Hindi stopwords and extracts unigrams and bigrams.

### Stage 3: CLASSIFY
- Employs a local TF-IDF Cosine vector model comparing input text against configurable bilingual civic prototypes:
  - `ROAD_DAMAGE`: potholes, caved-in road, crater, bitumen peeling, सड़क गड्ढा, सड़क धंस गई
  - `WATERLOGGING`: flood, submerged, waterlogging, knee-deep, जलभराव, नाला चोक
  - `WATER_SUPPLY`: pipe burst, contaminated water, dirty water, पाइपलाइन लीक, गंदा पानी
  - `ELECTRICITY`: transformer spark, loose wire, live wire, blackout, ट्रांसफार्मर स्पार्क, तार टूट
  - `GARBAGE_WASTE`: garbage dump, trash pile, foul smell, कचरा ढेर, बदबू
  - `PUBLIC_SAFETY`: wall collapse, dangerous bridge, open drain, नाला खुला, पुलिया टूटी
  - `HEALTH_SANITATION`: open sewer, mosquito breeding, dengue, सीवर ओवरफ्लो
- When confidence is below threshold or language is unsupported, transparently falls back to deterministic rule-based regex matching (`DETERMINISTIC_RULES`).

### Stage 4: EXTRACT
- Locality and landmark Named Entity Extractor.
- Matches against official Bihar districts (Patna, Gaya, Muzaffarpur, Bhagalpur, Darbhanga, etc.) and known urban localities (Kankarbagh, Boring Road, Bailey Road, Zero Mile, etc.).
- Identifies critical hazard keywords (e.g., *electric shock*, *cave-in*, *collapsed wall*).

### Stage 5: MATCH (Multi-Factor Duplicate Candidate Detection)
- Compares new grievances against recent unassigned/open cases using a weighted multi-factor formula:
  $$\text{Score} = (0.30 \times \text{Text Similarity}) + (0.25 \times \text{Category Agreement}) + (0.30 \times \text{Geo Proximity}) + (0.15 \times \text{Time Window Overlap})$$
  - **Text Similarity**: Jaccard token overlap of normalized n-grams.
  - **Category Agreement**: Exact match = 1.0; related civic branch = 0.5; mismatch = 0.0.
  - **Geo Proximity**: Haversine distance decay ($1 - \frac{\text{dist}}{1.0\text{km}}$, clamped to $[0, 1]$).
  - **Time Overlap**: Exponential decay over 72 hours ($\exp(-\Delta t / 48)$).
  - **Image Similarity**: Documented as unavailable ($0.0$) until computer vision model is plugged in.
- Pairs with composite score $\ge 0.55$ generate a `DuplicateCandidate` record.
- **Auditable Candidate Review Workflow**:
  - Authorised officials can confirm or reject candidates.
  - Confirmed candidates are merged into an `IncidentCluster` without deleting or mutating original citizen complaints.
  - Similarity scores are never treated as proof of duplication without official review.

### Stage 6: SCORE (Explainable Priority Engine)
- Transparent 6-factor composite priority formula (0–100 scale):
  - **Base Hazard Severity (0–30)**: Inherent physical danger (live wires, deep floods, toxic water).
  - **Corroborated Report Volume (0–25)**: Independent citizen complaints reporting the same incident. Social media popularity is strictly excluded to prevent viral manipulation.
  - **Recurrence Velocity (0–15)**: Rate of new incoming reports over the last 6–24 hours.
  - **SLA Duration & Aging (0–15)**: Time elapsed since intake without departmental dispatch.
  - **Geographic Spread (0–10)**: Radius of affected neighborhood/ward.
  - **Evidence Quality (0–5)**: Geolocation precision, phone verification, and attached documentation.
- Score categorization:
  - $\ge 80$: `CRITICAL`
  - $65 - 79$: `HIGH`
  - $40 - 64$: `MEDIUM`
  - $< 40$: `LOW`
- **Official Priority Override**:
  - Authorized officials (`SUPER_ADMIN`, `DISTRICT_MAGISTRATE`, `DEPARTMENT_OFFICER`) can override AI priority.
  - Mandatory justification (minimum 8 characters) required.
  - Stored permanently in `Grievance.priorityOverridden`, `priorityOverrideReason`, and `AuditLog`.

### Stage 7: ROUTE (Department Routing Engine)
- Configurable category-to-department matrix reflecting statutory Bihar municipal/state divisions:
  - `ROAD_DAMAGE` ➔ Rural Works Department (RWD) / Urban Development (UDHD)
  - `WATERLOGGING` ➔ Municipal Corporation Drainage Cell (MCD)
  - `WATER_SUPPLY` ➔ Public Health Engineering Department (PHED)
  - `ELECTRICITY` ➔ Bihar State Power Holding Company Ltd (BSPHCL)
  - `GARBAGE_WASTE` ➔ Municipal Solid Waste Management (MCD)
  - `PUBLIC_SAFETY` ➔ Bihar Police Grievance Cell (BHP) / Disaster Management
- Every recommendation requires human confirmation (`requiresHumanConfirmation: true`).

### Stage 8: ALERT (Threshold Anomaly Generator)
- Automatically evaluates system thresholds:
  - `CRITICAL_SAFETY`: Life-threatening hazard reported (live wire, bridge breach).
  - `CLUSTER_GROWTH`: Cluster reaching $\ge 4$ independent reports.
  - `AREA_HOTSPOT`: Locality accumulating $\ge 5$ active unresolved complaints.
  - `OVERDUE_SLA`: Complaint exceeding SLA resolution window without closure.
  - `DISTRICT_SURGE`: Sudden surge in unresolved grievances in a district.
- Every alert records the exact trigger rule, supporting case references, severity, and timestamp.

---

## 6. Security Model & RBAC

| Role | Grievance Intake | Dispatch / Assign | Priority Override | Cluster Merge/Reject | Resolve Case | Audit Logs |
|---|:---:|:---:|:---:|:---:|:---:|:---:|
| **Super Admin** | Full | Full | Full | Full | Full | Full View |
| **District Magistrate** | District-wide | District-wide | Full (with reason) | Full | Full | District View |
| **Department Officer** | Departmental | Departmental | Allowed (with reason) | Allowed | Full | Dept View |
| **Field Investigator** | Read-only | Status & Notes | Disallowed | Disallowed | Submit Verification | None |

---

## 7. Current Limitations & Future Roadmap

1. **Image Similarity**: The multi-factor duplicate engine currently scores image similarity as `0.0` (documented transparently). Phase 3 will integrate an on-device CLIP or MobileNet embedding service for photographic scene matching.
2. **Database Provider**: SQLite is utilized for zero-setup local verification. For production deployments with high concurrent load, swap `provider = "postgresql"` in `prisma/schema.prisma` and configure `DATABASE_URL`.
3. **Speech/Voice Intake**: Citizen phone hotline audio recordings currently rely on text transcription prior to pipeline ingest.
