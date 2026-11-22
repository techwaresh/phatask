import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import app from '../../src/app.js';

describe('Authentication API Suite', () => {
  it('GET /api/v1/health should return ok status', async () => {
    const res = await request(app).get('/api/v1/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
    expect(res.body.service).toBe('BWMS Backend');
  });

  it('POST /api/v1/auth/login should reject empty body with 400', async () => {
    const res = await request(app).post('/api/v1/auth/login').send({});
    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });

  it('POST /api/v1/auth/login should reject invalid email format with 400', async () => {
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'not-an-email', password: 'password123' });
    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });

  it('GET /api/v1/users/me without token should return 401 UNAUTHORIZED', async () => {
    const res = await request(app).get('/api/v1/users/me');
    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('UNAUTHORIZED');
  });

  it('GET /api/v1/plans without token should return 401 UNAUTHORIZED', async () => {
    const res = await request(app).get('/api/v1/plans');
    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  it('GET /api/v1/tasks without token should return 401 UNAUTHORIZED', async () => {
    const res = await request(app).get('/api/v1/tasks');
    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  it('GET /api/v1/reports without token should return 401 UNAUTHORIZED', async () => {
    const res = await request(app).get('/api/v1/reports');
    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });
});
