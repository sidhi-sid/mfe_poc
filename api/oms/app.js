'use strict';

/**
 * OMS Microservice — App Factory
 *
 * Builds and configures the Fastify instance with all plugins and routes.
 * Separated from server.js for testability.
 *
 * @module oms/app
 */

const cors = require('@fastify/cors');
const {
  config,
  authPlugin,
  errorHandlerPlugin,
  requestIdPlugin,
  responseTimePlugin,
  createLoggerOptions,
} = require('@mfe/shared');

const routes = require('./routes');

/**
 * Build the OMS Fastify application.
 *
 * @param {object} [opts={}] - Additional Fastify options
 * @returns {import('fastify').FastifyInstance}
 */
async function buildApp(opts = {}) {
  const fastify = require('fastify')({
    logger: createLoggerOptions('oms-api'),
    ...opts,
  });

  // ── Plugins ───────────────────────────────────────────────
  // CORS — allow MFE origins
  await fastify.register(cors, {
    origin: config.corsOrigins,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    credentials: true,
  });

  // Middleware
  await fastify.register(requestIdPlugin);
  await fastify.register(responseTimePlugin);

  // Auth plugin — adds lbToken to every request
  await fastify.register(authPlugin);

  // Global error handler
  await fastify.register(errorHandlerPlugin);

  // ── Health Check ──────────────────────────────────────────
  fastify.get('/health', async () => ({
    status: 'ok',
    service: 'oms-api',
    timestamp: new Date().toISOString(),
  }));

  // ── Routes ────────────────────────────────────────────────
  await fastify.register(routes, { prefix: '/api' });

  return fastify;
}

module.exports = { buildApp };
