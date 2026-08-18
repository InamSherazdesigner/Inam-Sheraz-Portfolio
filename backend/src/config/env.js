/**
 * ENVIRONMENT — parsed once, validated once, frozen.
 *
 * Nothing else in the codebase reads `process.env`. Every module imports `env`
 * from here, which means a missing or malformed variable fails at boot with a
 * readable message instead of surfacing as a confusing runtime error hours
 * later. Fail-Safe by Design.
 */

import { z } from 'zod';

const csv = (value) =>
  String(value)
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);

const schema = z
  .object({
    NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
    PORT: z.coerce.number().int().positive().max(65535).default(4000),
    CORS_ORIGINS: z.string().default('http://localhost:3000').transform(csv),

    MONGODB_URI: z.string().min(1, 'MONGODB_URI is required'),
    MONGODB_MAX_POOL_SIZE: z.coerce.number().int().positive().max(100).default(10),

    LOG_LEVEL: z
      .enum(['trace', 'debug', 'info', 'warn', 'error', 'fatal', 'silent'])
      .default('info'),

    VOICE_PROVIDER: z.enum(['elevenlabs', 'claude_tts', 'mock']).default('claude_tts'),
    ELEVENLABS_API_KEY: z.string().optional(),
    ELEVENLABS_AGENT_ID: z.string().optional(),
    ELEVENLABS_VOICE_ID: z.string().default('79mROaaWZt7qn4kThe7V'),
    ANTHROPIC_API_KEY: z.string().optional(),
    ELEVENLABS_API_BASE: z.string().url().default('https://api.elevenlabs.io'),

    VOICE_RATE_LIMIT_WINDOW_MS: z.coerce.number().int().positive().default(15 * 60 * 1000),
    VOICE_RATE_LIMIT_MAX: z.coerce.number().int().positive().default(30),
    VOICE_GLOBAL_LIMIT_MAX: z.coerce.number().int().positive().default(180),

    CONTACT_RATE_LIMIT_WINDOW_MS: z.coerce.number().int().positive().default(60 * 60 * 1000),
    CONTACT_RATE_LIMIT_MAX: z.coerce.number().int().positive().default(10),
    CONTACT_RECEIVER_EMAIL: z.string().email().default('inamsherazdesigner@gmail.com'),
    SMTP_HOST: z.string().optional(),
    SMTP_PORT: z.coerce.number().optional().default(587),
    SMTP_USER: z.string().optional(),
    SMTP_PASS: z.string().optional(),
    RESEND_API_KEY: z.string().optional(),

    CAT_GATE_PASSWORD: z.string().min(1).default('apperception'),
    GATE_RATE_LIMIT_WINDOW_MS: z.coerce.number().int().positive().default(15 * 60 * 1000),
    GATE_RATE_LIMIT_MAX: z.coerce.number().int().positive().default(20),
  })
  /**
   * The mock provider exists so the console, the widget and the tests can all
   * run with no credentials. It must never be what production is serving —
   * a silent fallback to a fake agent is worse than a failed boot.
   */
  .superRefine((cfg, ctx) => {
    if (cfg.VOICE_PROVIDER === 'elevenlabs') {
      if (!cfg.ELEVENLABS_API_KEY) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['ELEVENLABS_API_KEY'],
          message: 'required when VOICE_PROVIDER=elevenlabs',
        });
      }
      if (!cfg.ELEVENLABS_AGENT_ID) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['ELEVENLABS_AGENT_ID'],
          message: 'required when VOICE_PROVIDER=elevenlabs',
        });
      }
    }
    if (cfg.VOICE_PROVIDER === 'claude_tts') {
      if (!cfg.ELEVENLABS_API_KEY) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['ELEVENLABS_API_KEY'],
          message: 'required when VOICE_PROVIDER=claude_tts',
        });
      }
      if (!cfg.ANTHROPIC_API_KEY) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['ANTHROPIC_API_KEY'],
          message: 'required when VOICE_PROVIDER=claude_tts',
        });
      }
    }
    if (cfg.NODE_ENV === 'production' && cfg.VOICE_PROVIDER === 'mock') {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['VOICE_PROVIDER'],
        message: 'the mock voice provider must not be used in production',
      });
    }
  });

const parsed = schema.safeParse(process.env);

if (!parsed.success) {
  const lines = parsed.error.issues.map((i) => `  - ${i.path.join('.') || '(root)'}: ${i.message}`);
  // Written straight to stderr: the logger itself depends on this config, so
  // it does not exist yet at this point in the boot.
  process.stderr.write(
    `\nInvalid environment configuration. Refusing to start.\n${lines.join('\n')}\n\n` +
      `Copy backend/.env.example to backend/.env and fill it in.\n\n`
  );
  process.exit(1);
}

export const env = Object.freeze(parsed.data);

export const isProduction = env.NODE_ENV === 'production';
export const isTest = env.NODE_ENV === 'test';
