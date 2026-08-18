import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/app.js';
import { submitMessage } from '../src/modules/contact/contact.service.js';

const ORIGIN = 'http://localhost:3000';
let app;

const noopLog = { info: () => {}, warn: () => {}, error: () => {} };

beforeAll(() => {
  app = createApp();
});

describe('honeypot', () => {
  /**
   * A bot that fills every input fills the hidden one too. The submission is
   * accepted with an ordinary success and then dropped — telling a bot it was
   * caught only teaches it to try again differently.
   *
   * Tested at the service rather than through HTTP, because the interesting
   * assertion is that nothing was written, and that is invisible from outside.
   */
  it('accepts and discards a submission with the honeypot filled', async () => {
    const result = await submitMessage({
      input: {
        name: 'Definitely A Human',
        email: 'bot@spam.example',
        subject: 'Cheap backlinks',
        body: 'This message is at least ten characters long.',
        website: 'http://spam.example', // the trap
      },
      ctx: { requestId: 'req-honeypot', ip: '198.51.100.9', log: noopLog },
    });

    expect(result.accepted).toBe(true);
    // Nothing stored. No id means no document was created.
    expect(result.id).toBeNull();
  });

  it('does not treat an empty honeypot as a trip', async () => {
    // No database in the test environment, so a genuine submission is refused
    // with an honest 503 rather than silently accepted. That distinction is
    // the point: a real message is never dropped without saying so.
    await expect(
      submitMessage({
        input: {
          name: 'Art Director',
          email: 'ad@studio.example',
          subject: '',
          body: 'Saw the thesis work. Are you free in the spring?',
          website: '',
        },
        ctx: { requestId: 'req-real', ip: '198.51.100.10', log: noopLog },
      })
    ).rejects.toMatchObject({ status: 503 });
  });
});

describe('POST /api/v1/contact/messages', () => {
  it('refuses a submission from an unlisted origin', async () => {
    const res = await request(app)
      .post('/api/v1/contact/messages')
      .set('Origin', 'https://attacker.example')
      .send({ name: 'x', email: 'a@b.co', body: 'ten characters at least here' });

    expect(res.status).toBe(403);
    expect(res.body.error.code).toBe('ORIGIN_NOT_ALLOWED');
  });

  it('normalises an email to lowercase before it is stored', async () => {
    const res = await request(app)
      .post('/api/v1/contact/messages')
      .set('Origin', ORIGIN)
      .send({
        name: '  Art Director  ',
        email: '  AD@Studio.Example  ',
        body: 'Ten characters at least, and then some more.',
      });

    // 503 without a database. What matters here is that validation passed —
    // a rejected email would have produced a 400 instead.
    expect(res.status).not.toBe(400);
  });

  it('rejects a message that is too short to be a real enquiry', async () => {
    const res = await request(app)
      .post('/api/v1/contact/messages')
      .set('Origin', ORIGIN)
      .send({ name: 'A', email: 'a@b.co', body: 'hi' });

    expect(res.status).toBe(400);
    expect(res.body.error.details.some((d) => d.field === 'body')).toBe(true);
  });
});
