import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/app';
import { prisma } from '../src/lib/prisma';

const app = createApp();

describe('JANRAKSHA AI REST API Integration Tests', () => {
  beforeAll(async () => {
    // Ensure test database connection
    await prisma.$connect();
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it('GET /api/v1/health should return HEALTHY status', async () => {
    const res = await request(app).get('/api/v1/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('HEALTHY');
    expect(res.body.service).toContain('JANRAKSHA');
  });

  it('GET /api/v1/auth/personas should list demo user personas', async () => {
    const res = await request(app).get('/api/v1/auth/personas');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
  });

  it('GET /api/v1/grievances should list grievances with pagination', async () => {
    const res = await request(app)
      .get('/api/v1/grievances?limit=5')
      .set('x-user-role', 'SUPER_ADMIN');

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.pagination).toBeDefined();
    expect(Array.isArray(res.body.data.items)).toBe(true);
  });

  it('GET /api/v1/metrics/dashboard should return computed dashboard metrics', async () => {
    const res = await request(app)
      .get('/api/v1/metrics/dashboard')
      .set('x-user-role', 'SUPER_ADMIN');

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.summary).toBeDefined();
    expect(res.body.data.severityDistribution).toBeDefined();
    expect(res.body.data.departmentWorkload).toBeDefined();
  });

  it('POST /api/v1/grievances should create a new grievance with AI analysis', async () => {
    const payload = {
      title: 'Pothole near Boring Road intersection',
      description: 'Major asphalt damage and pothole causing traffic jam and minor vehicle damage.',
      complainantName: 'Aarav Sharma (Test Complainant)',
      complainantPhone: '9835099999',
      latitude: 25.615,
      longitude: 85.112,
      address: 'Near Boring Road crossing, Patna',
      locality: 'Boring Road',
      district: 'Patna Central',
    };

    const res = await request(app)
      .post('/api/v1/grievances')
      .set('x-user-role', 'SUPER_ADMIN')
      .send(payload);

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.trackingId).toMatch(/^JAN-2026-/);
    expect(res.body.data.aiAnalysis).toBeDefined();
    expect(['REAL_LOCAL_MODEL', 'DETERMINISTIC_RULES', 'DEMO_RULE_BASED']).toContain(res.body.data.aiAnalysis.engineMode);
  });
});
