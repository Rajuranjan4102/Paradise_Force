# JANRAKSHA AI — Security Specification
**Bihar Police Hackathon | PS-04**

---

## 1. Security Architecture Principles

JANRAKSHA AI adheres to defence-in-depth principles:
1. **Never trust client state**: All access checks, role permissions, and input constraints are validated authoritatively on the backend server.
2. **Explicit Role-Based Access Control (RBAC)**: Fine-grained permissions dictate what each actor can view or mutate.
3. **Audit Immutability**: Every mutation to a grievance's status, assignment, severity, or internal note is committed to an immutable append-only audit trail.
4. **Data Sanitization & Injection Prevention**: Parameterized database queries via Prisma ORM and strict runtime validation via Zod schemas.

---

## 2. Role-Based Access Matrix

| Role | Grievances Read | Grievance Create | Assign / Transfer | Status Update | Resolve Case | View Audit Log | System Config |
|---|:---:|:---:|:---:|:---:|:---:|:---:|:---:|
| **SUPER_ADMIN** | All | Yes | Any Department | Any Status | Yes | Full Trail | Yes |
| **DISTRICT_MAGISTRATE** | District-wide | Yes | Any Department in District | Any Status | Yes | District Trail | View Only |
| **DEPARTMENT_OFFICER** | Own Department | Yes | Within Own Dept | In Progress / Verify | Yes (Dept Cases) | Case Level | No |
| **FIELD_INVESTIGATOR** | Assigned Cases | Yes | No | In Progress / Verify | No (Submit verification) | Case Level | No |

---

## 3. Demo / Development Authentication Strategy

For local evaluation and hackathon review without requiring external SMS OTP or OAuth gateways:
- A structured Bearer token or pre-configured session persona header (`x-user-role`, `Authorization: Bearer <token>`) is supported.
- Pre-seeded system personas are provided for instant testing:
  - `admin@biharpolice.gov.in` (Role: `SUPER_ADMIN`)
  - `dm.patna@bihar.gov.in` (Role: `DISTRICT_MAGISTRATE`)
  - `officer.pwd@bihar.gov.in` (Role: `DEPARTMENT_OFFICER`)
  - `field.inspector@bihar.gov.in` (Role: `FIELD_INVESTIGATOR`)
- The active persona can be switched on-the-fly directly in the frontend header/settings panel to simulate role permissions live.

---

## 4. Input Validation & Query Safety

- **Zod Schemas**: Strict type checking and string trimming on all endpoints (e.g. `title` min 5 chars, `description` min 10 chars, valid phone number format, latitude/longitude bounds).
- **ORM Protection**: Prisma ORM executes parameterized queries under the hood, eliminating SQL injection vectors.
- **Cross-Department Isolation**: Queries executed by department officers filter by `departmentId` at the database query level, preventing horizontal privilege escalation.

---

## 5. Audit Logging Standard

Every critical transition invokes the internal `AuditService`:
```typescript
await auditService.record({
  action: 'GRIEVANCE_STATUS_UPDATE',
  actorId: currentUser.id,
  actorName: currentUser.name,
  actorRole: currentUser.role,
  entityType: 'GRIEVANCE',
  entityId: grievanceId,
  oldValues: { status: previousStatus },
  newValues: { status: newStatus, note: resolutionNote },
  ipAddress: req.ip,
});
```

Logs are timestamped, indexed, and accessible to authorized administrative personas in the Administration & Settings panel.
