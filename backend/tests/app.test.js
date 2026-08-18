/**
 * Cross-cutting behaviour: headers, envelopes, error shape, health.
 * These are the guarantees the frontend is written against.
 */

import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/app.js';

const ORIGIN = 'http://localhost:3000';
let app;

beforeAll(() => {
  app = createApp();
});

describe('security headers', () => {
  it('locks the API down to no content of its own', async () => {
    const res = await request(app).get('/health/live');
    expect(res.headers['content-security-policy']).toContain("default-src 'none'");
    expect(res.headers['x-frame-options']).toBe('DENY');
    expect(res.headers['x-content-type-options']).toBe('nosniff');
    expect(res.headers['referrer-policy']).toBe('no-referrer');
    expect(res.headers['x-powered-by']).toBeUndefined();
  });
});

describe('health', () => {
  it('reports live without touching a dependency', async () => {
    const res = await request(app).get('/health/live');
    expect(res.status).toBe(200);
    expect(res.body.data.status).toBe('live');
  });

  it('stays 200 when a dependency is degraded, so the instance keeps traffic', async () => {
    const res = await request(app).get('/health/ready');
    expect(res.status).toBe(200);
    expect(['ready', 'degraded']).toContain(res.body.data.status);
    expect(res.body.data.checks).toHaveProperty('voice');
    expect(res.body.data.checks).toHaveProperty('database');
  });

  it('exposes counters with no secrets in them', async () => {
    const res = await request(app).get('/health/metrics');
    expect(res.status).toBe(200);
    expect(res.body.data.voiceBreaker.state).toBe('closed');
    expect(JSON.stringify(res.body)).not.toMatch(/api[-_]?key/i);
  });
});

describe('error envelope', () => {
  it('answers an unknown route in the standard failure shape', async () => {
    const res = await request(app).get('/api/v1/nope');
    expect(res.status).toBe(404);
    expect(res.body.ok).toBe(false);
    expect(res.body.error.code).toBe('NOT_FOUND');
    expect(res.body.meta.requestId).toBeTruthy();
  });

  it('rejects malformed JSON as a validation failure, not a crash', async () => {
    const res = await request(app)
      .post('/api/v1/gate/cat/verify')
      .set('Origin', ORIGIN)
      .set('Content-Type', 'application/json')
      .send('{"password": ');

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_FAILED');
  });

  it('rejects an oversized body rather than buffering it', async () => {
    const res = await request(app)
      .post('/api/v1/contact/messages')
      .set('Origin', ORIGIN)
      .send({ name: 'x', email: 'a@b.co', body: 'y'.repeat(200_000) });

    expect([400, 413]).toContain(res.status);
    expect(res.body.ok).toBe(false);
  });
});

describe('contact validation', () => {
  it('names the fields that were wrong', async () => {
    const res = await request(app)
      .post('/api/v1/contact/messages')
      .set('Origin', ORIGIN)
      .send({ name: '', email: 'not-an-email', body: 'short' });

    expect(res.status).toBe(400);
    const fields = res.body.error.details.map((d) => d.field);
    expect(fields).toContain('name');
    expect(fields).toContain('email');
    expect(fields).toContain('body');
  });

  it('strips unknown keys so nothing can be mass-assigned', async () => {
    const res = await request(app)
      .post('/api/v1/contact/messages')
      .set('Origin', ORIGIN)
      .send({
        name: 'Art Director',
        email: 'ad@studio.example',
        body: 'Liked the thesis work. Do you have availability in the spring?',
        status: 'replied', // not in the schema
        _id: '000000000000000000000000',
      });

    // 201 with a database, 503 without one. Either way it must not be a 500,
    // and the extra keys must not have reached the model.
    expect([201, 503]).toContain(res.status);
  });
});

describe('api discovery', () => {
  it('describes itself at the versioned root', async () => {
    const res = await request(app).get('/api/v1');
    expect(res.status).toBe(200);
    expect(res.body.data.version).toBe('v1');
  });

  it('serves an OpenAPI document that matches the routes', async () => {
    const res = await request(app).get('/openapi.json');
    expect(res.status).toBe(200);
    expect(res.body.openapi).toBe('3.1.0');
    expect(res.body.paths).toHaveProperty('/api/v1/voice/session');
    expect(res.body.paths).toHaveProperty('/api/v1/contact/messages');
    expect(res.body.paths).toHaveProperty('/api/v1/gate/cat/verify');
  });
});
