import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/app';
import { prisma } from '../src/lib/prisma';

const app = createApp();

describe('Phase 2: Intelligence API & Security Integration Tests', () => {
  beforeAll(async () => {
    await prisma.$connect();
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it('GET /api/v1/departments/recommend should recommend department with justification and confirmation requirement', async () => {
    const res = await request(app)
      .get('/api/v1/departments/recommend?category=ROAD_DAMAGE&district=Patna Central')
      .set('x-user-role', 'SUPER_ADMIN');

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.recommendedDepartmentCode).toBe('PWD');
    expect(res.body.data.requiresHumanConfirmation).toBe(true);
    expect(res.body.data.routingReason).toContain('Road Construction & Public Works');
  });

  it('GET /api/v1/duplicates should list candidate duplicate pairs with evidence', async () => {
    const res = await request(app)
      .get('/api/v1/duplicates')
      .set('x-user-role', 'SUPER_ADMIN');

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
  });

  it('POST /api/v1/grievances/:id/priority-override should record official priority override with mandatory reason', async () => {
    // Find an existing open case
    const grievance = await prisma.grievance.findFirst({
      where: { status: { not: 'RESOLVED' } },
    });
    if (!grievance) return;

    const res = await request(app)
      .post(`/api/v1/grievances/${grievance.id}/priority-override`)
      .set('x-user-role', 'SUPER_ADMIN')
      .send({
        priority: 'CRITICAL',
        reason: 'Authorized field verification: severe electrocution hazard near crowded school gate',
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.severity).toBe('CRITICAL');
    expect(res.body.data.priorityOverridden).toBe(true);
    expect(res.body.data.priorityOverrideReason).toContain('electrocution hazard');
  });

  it('RBAC SECURITY: Field Investigator should be forbidden from overriding priority (403)', async () => {
    const grievance = await prisma.grievance.findFirst();
    if (!grievance) return;

    const res = await request(app)
      .post(`/api/v1/grievances/${grievance.id}/priority-override`)
      .set('x-user-role', 'FIELD_INVESTIGATOR')
      .send({
        priority: 'CRITICAL',
        reason: 'Attempted unauthorized override',
      });

    expect(res.status).toBe(403);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toContain('Forbidden');
  });

  it('POST /api/v1/clusters/:id/merge and DELETE /api/v1/clusters/cases/:grievanceId should merge and remove cases without deleting records', async () => {
    const cluster = await prisma.incidentCluster.findFirst({
      include: { grievances: true },
    });
    const standaloneCase = await prisma.grievance.findFirst({
      where: { incidentClusterId: null },
    });

    if (!cluster || !standaloneCase) return;

    // Merge case into cluster
    const mergeRes = await request(app)
      .post(`/api/v1/clusters/${cluster.id}/merge`)
      .set('x-user-role', 'SUPER_ADMIN')
      .send({ grievanceIds: [standaloneCase.id] });

    expect(mergeRes.status).toBe(200);
    expect(mergeRes.body.success).toBe(true);

    // Verify case is now linked to cluster
    const updatedCase = await prisma.grievance.findUnique({ where: { id: standaloneCase.id } });
    expect(updatedCase?.incidentClusterId).toBe(cluster.id);

    // Remove case from cluster
    const removeRes = await request(app)
      .delete(`/api/v1/clusters/cases/${standaloneCase.id}`)
      .set('x-user-role', 'SUPER_ADMIN');

    expect(removeRes.status).toBe(200);
    expect(removeRes.body.success).toBe(true);

    // Verify record is preserved and unlinked
    const unlinkedCase = await prisma.grievance.findUnique({ where: { id: standaloneCase.id } });
    expect(unlinkedCase?.incidentClusterId).toBeNull();
  });
});
