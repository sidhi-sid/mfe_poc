'use strict';

/**
 * Register graceful shutdown handlers for the Fastify server.
 * Catches SIGTERM and SIGINT signals, closes the server cleanly,
 * and exits the process.
 *
 * @param {import('fastify').FastifyInstance} fastify
 * @param {object} [logger=console] - Logger instance
 */
function registerGracefulShutdown(fastify, logger = console) {
  const shutdown = async (signal) => {
    logger.info(`Received ${signal}. Starting graceful shutdown...`);

    try {
      await fastify.close();
      logger.info('Server closed successfully.');
      process.exit(0);
    } catch (err) {
      logger.error('Error during shutdown:', err);
      process.exit(1);
    }
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
}

module.exports = { registerGracefulShutdown };
