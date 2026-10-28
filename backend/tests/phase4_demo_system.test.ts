import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/app';
import { prisma } from '../src/lib/prisma';

const app = createApp();

describe('Phase 4: Hackathon Polish, System Diagnostics & Guided Demo Tests', () => {
  beforeAll(async () => {
    await prisma.$connect();
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it('GET /api/v1/system/status should return comprehensive actual system diagnostics', async () => {
    const res = await request(app).get('/api/v1/system/status');

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    const data = res.body.data;
    expect(data.status).toBe('OPERATIONAL');
    expect(data.overallHealth).toBe('HEALTHY');

    // Database state
    expect(data.database).toBeDefined();
    expect(data.database.status).toBe('CONNECTED');
    expect(data.database.provider).toContain('SQLite');
    expect(data.database.records.grievances).toBeGreaterThan(0);
    expect(data.database.pingLatencyMs).toBeTypeOf('number');

    // Analysis Engine
    expect(data.analysisEngine).toBeDefined();
    expect(data.analysisEngine.status).toBe('ACTIVE');
    expect(data.analysisEngine.providerName).toBeDefined();
    expect(data.analysisEngine.supportedCategories).toContain('ELECTRICITY');
    expect(data.analysisEngine.supportedLanguages).toContain('hi');

    // Map Service
    expect(data.mapService).toBeDefined();
    expect(data.mapService.status).toBe('ACTIVE');
    expect(data.mapService.prohibitsInventedCoordinates).toBe(true);

    // Ingestion Connectors
    expect(Array.isArray(data.ingestionConnectors)).toBe(true);
    expect(data.ingestionConnectors.length).toBeGreaterThanOrEqual(3);

    // Runtime Telemetry
    expect(data.runtime).toBeDefined();
    expect(data.runtime.nodeVersion).toBeDefined();
    expect(data.runtime.memory.heapUsedMB).toBeGreaterThan(0);
  });

  it('GET /api/v1/demo/overview should return scenario overview and database counts', async () => {
    const res = await request(app)
      .get('/api/v1/demo/overview')
      .set('x-user-role', 'SUPER_ADMIN');

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.totalSteps).toBe(8);
    expect(res.body.data.scenarioName).toContain('CLUST-ELEC-409');
    expect(res.body.data.databaseMetrics.totalGrievances).toBeGreaterThan(0);
  });

  it('POST /api/v1/demo/step should execute complete 8-step incident simulation', async () => {
    // Step 1: Incoming Reports
    const res1 = await request(app)
      .post('/api/v1/demo/step')
      .set('x-user-role', 'SUPER_ADMIN')
      .send({ step: 1 });
    expect(res1.status).toBe(200);
    expect(res1.body.data.step).toBe(1);
    expect(res1.body.data.details.reports.length).toBe(3);

    // Step 2: Pipeline Classification
    const res2 = await request(app)
      .post('/api/v1/demo/step')
      .set('x-user-role', 'SUPER_ADMIN')
      .send({ step: 2 });
    expect(res2.status).toBe(200);
    expect(res2.body.data.step).toBe(2);
    expect(res2.body.data.details.categoryConfidence).toBe('98.0%');

    // Step 3: Spatial-Semantic Grouping
    const res3 = await request(app)
      .post('/api/v1/demo/step')
      .set('x-user-role', 'SUPER_ADMIN')
      .send({ step: 3 });
    expect(res3.status).toBe(200);
    expect(res3.body.data.step).toBe(3);
    expect(res3.body.data.details.clusterCode).toBe('CLUST-ELEC-409');

    // Step 4: Explainable Priority Scoring
    const res4 = await request(app)
      .post('/api/v1/demo/step')
      .set('x-user-role', 'SUPER_ADMIN')
      .send({ step: 4 });
    expect(res4.status).toBe(200);
    expect(res4.body.data.step).toBe(4);
    expect(res4.body.data.details.compositeScore).toContain('92 / 100');
    expect(res4.body.data.details.weightsBreakdown.length).toBe(6);

    // Step 5: Threshold Alert Emitted
    const res5 = await request(app)
      .post('/api/v1/demo/step')
      .set('x-user-role', 'SUPER_ADMIN')
      .send({ step: 5 });
    expect(res5.status).toBe(200);
    expect(res5.body.data.step).toBe(5);
    expect(res5.body.data.details.severityLevel).toContain('CRITICAL');

    // Step 6: Authorised Officer Assignment
    const res6 = await request(app)
      .post('/api/v1/demo/step')
      .set('x-user-role', 'SUPER_ADMIN')
      .send({ step: 6 });
    expect(res6.status).toBe(200);
    expect(res6.body.data.step).toBe(6);
    expect(res6.body.data.details.designatedOfficer).toContain('Sunita Kumari');

    // Step 7: Official Verification and Resolution
    const res7 = await request(app)
      .post('/api/v1/demo/step')
      .set('x-user-role', 'SUPER_ADMIN')
      .send({ step: 7 });
    expect(res7.status).toBe(200);
    expect(res7.body.data.step).toBe(7);
    expect(res7.body.data.details.clusterResolutionStatus).toBe('RESOLVED');
    expect(res7.body.data.details.physicalVerificationStatus).toContain('VERIFIED');

    // Step 8: Dashboard & Audit Timeline
    const res8 = await request(app)
      .post('/api/v1/demo/step')
      .set('x-user-role', 'SUPER_ADMIN')
      .send({ step: 8 });
    expect(res8.status).toBe(200);
    expect(res8.body.data.step).toBe(8);
    expect(res8.body.data.details.demoCompleted).toBe(true);
    expect(res8.body.data.details.recentAuditEvents.length).toBeGreaterThan(0);
  });

  it('POST /api/v1/demo/reset should safely reset database to factory seeded state', async () => {
    const res = await request(app)
      .post('/api/v1/demo/reset')
      .set('x-user-role', 'SUPER_ADMIN')
      .send();

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.message).toContain('Demo environment safely reset');

    // Verify records exist after reset
    const grievancesCount = await prisma.grievance.count();
    expect(grievancesCount).toBeGreaterThan(10);
  }, 30000);
});
