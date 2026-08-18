/**
 * OPENAPI 3.1 — served at /openapi.json.
 *
 * Written by hand and kept next to the routes rather than generated from them.
 * It is the contract the frontend is built against; if the two drift, the
 * contract tests in tests/contract.test.js fail.
 */

export const openApiDocument = {
  openapi: '3.1.0',
  info: {
    title: 'Inam Sheraz Portfolio API',
    version: '1.0.0',
    description:
      'Supports the portfolio front end. Its primary job is to hold the ElevenLabs credential ' +
      'so the browser can talk to a voice agent without ever seeing a key.',
    contact: { name: 'Inam Sheraz' },
  },
  servers: [
    { url: 'http://localhost:4000', description: 'Local' },
    { url: 'https://api.example.com', description: 'Production — set at deploy time' },
  ],
  tags: [
    { name: 'voice', description: 'Voice agent session brokering' },
    { name: 'contact', description: 'Enquiries' },
    { name: 'gate', description: 'CAT set password check' },
    { name: 'health', description: 'Liveness, readiness, counters' },
  ],
  paths: {
    '/api/v1/voice/session': {
      post: {
        tags: ['voice'],
        summary: 'Mint a short-lived voice-agent session',
        description:
          'Exchanges the server-held ElevenLabs API key for a signed WebSocket URL that expires ' +
          'in about 45 seconds. The API key is never included in the response and never reaches ' +
          'the browser. Requires an Origin header matching CORS_ORIGINS. Rate limited per IP and ' +
          'globally, because each session bills per minute.',
        responses: {
          200: {
            description: 'Session issued',
            headers: {
              'Cache-Control': {
                schema: { type: 'string' },
                description: 'Always no-store — the body carries a bearer token.',
              },
            },
            content: {
              'application/json': {
                schema: {
                  allOf: [
                    { $ref: '#/components/schemas/SuccessEnvelope' },
                    {
                      type: 'object',
                      properties: { data: { $ref: '#/components/schemas/VoiceSession' } },
                    },
                  ],
                },
              },
            },
          },
          403: { $ref: '#/components/responses/Forbidden' },
          429: { $ref: '#/components/responses/RateLimited' },
          502: { $ref: '#/components/responses/Upstream' },
          503: { $ref: '#/components/responses/Upstream' },
        },
      },
    },
    '/api/v1/contact/messages': {
      post: {
        tags: ['contact'],
        summary: 'Send an enquiry',
        requestBody: {
          required: true,
          content: {
            'application/json': { schema: { $ref: '#/components/schemas/ContactMessage' } },
          },
        },
        responses: {
          201: { description: 'Accepted' },
          400: { $ref: '#/components/responses/Validation' },
          429: { $ref: '#/components/responses/RateLimited' },
          503: { $ref: '#/components/responses/Upstream' },
        },
      },
    },
    '/api/v1/gate/cat/verify': {
      post: {
        tags: ['gate'],
        summary: 'Check the CAT set password',
        description:
          'A deterrent, not access control. The artwork sits at static URLs; this only keeps the ' +
          'password out of the JavaScript bundle and slows guessing.',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['password'],
                properties: { password: { type: 'string', maxLength: 200 } },
              },
            },
          },
        },
        responses: {
          200: { description: 'Unlocked' },
          403: { $ref: '#/components/responses/Forbidden' },
          429: { $ref: '#/components/responses/RateLimited' },
        },
      },
    },
    '/health/live': {
      get: { tags: ['health'], summary: 'Process liveness', responses: { 200: { description: 'Live' } } },
    },
    '/health/ready': {
      get: {
        tags: ['health'],
        summary: 'Dependency readiness',
        description:
          'Returns 200 with status "degraded" when a dependency is down. The website renders ' +
          'without either dependency, so a degraded instance still takes traffic.',
        responses: { 200: { description: 'Ready or degraded' } },
      },
    },
    '/health/metrics': {
      get: { tags: ['health'], summary: 'Counters', responses: { 200: { description: 'Counters' } } },
    },
  },
  components: {
    schemas: {
      SuccessEnvelope: {
        type: 'object',
        required: ['ok', 'data', 'meta'],
        properties: {
          ok: { const: true },
          data: {},
          meta: { type: 'object', properties: { requestId: { type: 'string' } } },
        },
      },
      ErrorEnvelope: {
        type: 'object',
        required: ['ok', 'error', 'meta'],
        properties: {
          ok: { const: false },
          error: {
            type: 'object',
            required: ['code', 'message'],
            properties: {
              code: {
                type: 'string',
                enum: [
                  'VALIDATION_FAILED',
                  'NOT_FOUND',
                  'RATE_LIMITED',
                  'ORIGIN_NOT_ALLOWED',
                  'UPSTREAM_UNAVAILABLE',
                  'UPSTREAM_REJECTED',
                  'VOICE_DISABLED',
                  'GATE_DENIED',
                  'INTERNAL',
                ],
              },
              message: { type: 'string' },
              details: { type: 'array', items: { type: 'object' } },
            },
          },
          meta: { type: 'object', properties: { requestId: { type: 'string' } } },
        },
      },
      VoiceSession: {
        type: 'object',
        required: ['provider', 'transport', 'signedUrl', 'agentId', 'expiresAt'],
        properties: {
          provider: { type: 'string', enum: ['elevenlabs', 'mock'] },
          transport: { type: 'string', enum: ['websocket'] },
          signedUrl: {
            type: 'string',
            format: 'uri',
            description: 'wss:// URL, single-purpose and short-lived. Treat as a bearer token.',
          },
          agentId: { type: 'string' },
          expiresAt: { type: 'string', format: 'date-time' },
          expiresInSeconds: { type: 'integer' },
        },
      },
      ContactMessage: {
        type: 'object',
        required: ['name', 'email', 'body'],
        properties: {
          name: { type: 'string', maxLength: 120 },
          email: { type: 'string', format: 'email', maxLength: 254 },
          subject: { type: 'string', maxLength: 200 },
          body: { type: 'string', minLength: 10, maxLength: 5000 },
          website: { type: 'string', description: 'Honeypot. Must be empty.' },
        },
      },
    },
    responses: {
      Validation: {
        description: 'Validation failed',
        content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorEnvelope' } } },
      },
      Forbidden: {
        description: 'Refused',
        content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorEnvelope' } } },
      },
      RateLimited: {
        description: 'Too many requests',
        headers: { 'Retry-After': { schema: { type: 'integer' } } },
        content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorEnvelope' } } },
      },
      Upstream: {
        description: 'A dependency failed',
        content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorEnvelope' } } },
      },
    },
  },
};
