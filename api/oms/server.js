'use strict';

/**
 * OMS Microservice — Server Entry Point
 *
 * Loads environment, builds the app, starts listening, and registers shutdown handlers.
 */

require('dotenv').config();

const { buildApp } = require('./app');
const { registerGracefulShutdown } = require('@mfe/shared');

async function start() {
  const fastify = await buildApp();

  const port = process.env.PORT || 4002;
  await fastify.listen({ port, host: '0.0.0.0' });
  fastify.log.info(`OMS API running on http://localhost:${port}`);

  // Graceful shutdown on SIGTERM/SIGINT
  registerGracefulShutdown(fastify, fastify.log);
}

start().catch((err) => {
  console.error('Failed to start OMS API:', err);
  process.exit(1);
});
