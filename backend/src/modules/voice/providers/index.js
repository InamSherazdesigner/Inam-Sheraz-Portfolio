/**
 * Provider selection. One switch, resolved once at boot from validated config.
 * Nothing downstream branches on provider name.
 */

import { env } from '../../../config/env.js';
import { logger } from '../../../lib/logger.js';
import { createElevenLabsProvider } from './elevenlabs.provider.js';
import { createClaudeTtsProvider } from './claude_tts.provider.js';
import { createMockProvider } from './mock.provider.js';

const factories = {
  elevenlabs: createElevenLabsProvider,
  claude_tts: createClaudeTtsProvider,
  mock: createMockProvider,
};

let instance;

export function getVoiceProvider() {
  if (!instance) {
    const factory = factories[env.VOICE_PROVIDER];
    instance = factory({ logger });
    logger.info({ provider: instance.name }, 'voice provider ready');
  }
  return instance;
}

/** Tests swap in a stub and reset afterwards. */
export function __setVoiceProvider(provider) {
  instance = provider;
}
