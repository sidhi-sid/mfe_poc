'use strict';

/**
 * Dashboard Routes — Auto-registration
 *
 * Registers all route modules under the /api prefix.
 */

const dashboardRoutes = require('./dashboard');

async function routes(fastify) {
  await fastify.register(dashboardRoutes);
}

module.exports = routes;
