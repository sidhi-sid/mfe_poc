'use strict';

/**
 * OMS Routes — Auto-registration
 *
 * Registers all route modules under the /api prefix.
 */

const instrumentRoutes = require('./instruments');
const proxyRoutes = require('./proxy');

async function routes(fastify) {
  // OMS-specific routes
  await fastify.register(instrumentRoutes);

  // Generic LoopBack proxy (catch-all for any LoopBack endpoint)
  await fastify.register(proxyRoutes, { prefix: '/lb' });
}

module.exports = routes;
