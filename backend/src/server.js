/**
 * BOOTSTRAP — process lifecycle.
 *
 * Graceful shutdown is not ceremony. A container is stopped by SIGTERM
 * constantly: every deploy, every scale event, every host drain. A process
 * that exits immediately on SIGTERM drops whatever requests were in flight,
 * so every deploy produces a handful of errors nobody can reproduce.
 */

import { createApp } from './app.js';
import { env } from './config/env.js';
import { logger } from './lib/logger.js';
import { connectDatabase, disconnectDatabase } from './config/database.js';
import { getVoiceProvider } from './modules/voice/providers/index.js';

const SHUTDOWN_TIMEOUT_MS = 10_000;

async function main() {
  await connectDatabase();

  // Resolve the provider at boot rather than on the first visitor's request:
  // a misconfiguration should surface in the deploy log, not in someone's
  // browser.
  const provider = getVoiceProvider();

  const app = createApp();
  const server = app.listen(env.PORT, () => {
    logger.info(
      { port: env.PORT, env: env.NODE_ENV, voiceProvider: provider.name },
      'portfolio api listening'
    );
  });

  // Slightly above a typical 60s ALB idle timeout, so the proxy closes idle
  // connections first and this server never races it into a 502.
  server.keepAliveTimeout = 65_000;
  server.headersTimeout = 66_000;

  let shuttingDown = false;

  async function shutdown(signal) {
    if (shuttingDown) return;
    shuttingDown = true;
    logger.info({ signal }, 'shutting down');

    // Anything still unfinished after the grace period is abandoned. Hanging
    // forever is worse than a hard exit — the orchestrator will SIGKILL us
    // anyway, and this way the reason is in the log.
    const forced = setTimeout(() => {
      logger.error('graceful shutdown timed out — forcing exit');
      process.exit(1);
    }, SHUTDOWN_TIMEOUT_MS);
    forced.unref();

    server.close(async () => {
      await disconnectDatabase();
      logger.info('shutdown complete');
      process.exit(0);
    });
  }

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));

  /**
   * An uncaught exception leaves the process in an unknown state — the safe
   * response is to log it and let the orchestrator start a clean one, not to
   * carry on and serve requests from a corrupted runtime.
   */
  process.on('uncaughtException', (error) => {
    logger.fatal({ err: error }, 'uncaught exception');
    shutdown('uncaughtException');
  });
  process.on('unhandledRejection', (reason) => {
    logger.fatal({ err: reason }, 'unhandled rejection');
    shutdown('unhandledRejection');
  });
}

main().catch((error) => {
  logger.fatal({ err: error }, 'failed to start');
  process.exit(1);
});
