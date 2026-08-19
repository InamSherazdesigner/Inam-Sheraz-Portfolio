import { describe, it, expect, vi, beforeEach } from 'vitest';
import { POST } from '@/app/api/v1/contact/messages/route';

describe('POST /api/v1/contact/messages', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('rejects submissions with missing name or invalid email or short body', async () => {
    const req = new Request('http://localhost:3000/api/v1/contact/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: '',
        email: 'invalid-email',
        body: 'short',
      }),
    });

    const res = await POST(req);
    const json = await res.json();

    expect(res.status).toBe(400);
    expect(json.ok).toBe(false);
    expect(json.error.details).toHaveLength(3);
  });

  it('silently accepts honeypot submissions', async () => {
    const req = new Request('http://localhost:3000/api/v1/contact/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Spam Bot',
        email: 'spam@bot.com',
        body: 'This is a spam message for you.',
        website: 'http://spam-link.com',
      }),
    });

    const res = await POST(req);
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.ok).toBe(true);
    expect(json.data.accepted).toBe(true);
  });

  it('accepts valid contact messages and returns standard envelope', async () => {
    const req = new Request('http://localhost:3000/api/v1/contact/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Jane Doe',
        email: 'jane@example.com',
        subject: 'Project Inquiry',
        body: 'Hello Inam, I would love to collaborate with you on a branding project!',
      }),
    });

    const res = await POST(req);
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.ok).toBe(true);
    expect(json.data.accepted).toBe(true);
    expect(json.data.message).toMatch(/Message received/i);
  });
});
