import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/app.js';

const ORIGIN = 'http://localhost:3000';
let app;

beforeAll(() => {
  app = createApp();
});

describe('POST /api/v1/gate/cat/verify', () => {
  it('unlocks on the correct password', async () => {
    const res = await request(app)
      .post('/api/v1/gate/cat/verify')
      .set('Origin', ORIGIN)
      .send({ password: 'apperception' });

    expect(res.status).toBe(200);
    expect(res.body.data.unlocked).toBe(true);
  });

  it('is case and whitespace insensitive, matching the original build', async () => {
    const res = await request(app)
      .post('/api/v1/gate/cat/verify')
      .set('Origin', ORIGIN)
      .send({ password: '  APPERCEPTION ' });

    expect(res.status).toBe(200);
  });

  it('refuses a wrong password without revealing the right one', async () => {
    const res = await request(app)
      .post('/api/v1/gate/cat/verify')
      .set('Origin', ORIGIN)
      .send({ password: 'guess' });

    expect(res.status).toBe(403);
    expect(res.body.error.code).toBe('GATE_DENIED');
    expect(JSON.stringify(res.body)).not.toContain('apperception');
  });

  it('rejects an empty submission with a field-level message', async () => {
    const res = await request(app)
      .post('/api/v1/gate/cat/verify')
      .set('Origin', ORIGIN)
      .send({ password: '' });

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_FAILED');
    expect(res.body.error.details[0].field).toBe('password');
  });
});
