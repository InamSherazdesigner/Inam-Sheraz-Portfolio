/**
 * Test environment. Set before any module reads config, because env.js parses
 * process.env at import time and exits the process if it is invalid.
 *
 * VOICE_PROVIDER=mock keeps the suite free of network calls and credentials —
 * a test run must never be able to spend money.
 */

process.env.NODE_ENV = 'test';
process.env.PORT = '4999';
process.env.MONGODB_URI = 'mongodb://127.0.0.1:27017/inam-portfolio-test';
process.env.CORS_ORIGINS = 'http://localhost:3000,https://inamsheraz.example';
process.env.VOICE_PROVIDER = 'mock';
process.env.LOG_LEVEL = 'silent';
process.env.CAT_GATE_PASSWORD = 'apperception';

/**
 * A recognisable fake credential. VOICE_PROVIDER is 'mock', so nothing reaches
 * the network — but elevenlabs.provider.test.js builds the real provider
 * against a stubbed fetch and asserts this exact string lands in the request
 * header and appears nowhere in the response.
 */
process.env.ELEVENLABS_API_KEY = 'sk_test_not_a_real_key_0000000000';
process.env.ELEVENLABS_AGENT_ID = 'agent_test_0001';

// Generous, so a legitimately rate-limited test is the exception being tested
// rather than an accident of ordering.
process.env.VOICE_RATE_LIMIT_MAX = '1000';
process.env.VOICE_GLOBAL_LIMIT_MAX = '1000';
process.env.CONTACT_RATE_LIMIT_MAX = '1000';
process.env.GATE_RATE_LIMIT_MAX = '1000';
