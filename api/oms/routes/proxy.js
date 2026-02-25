'use strict';

const { proxyToLoopback } = require('../../shared/lb-proxy');

/**
 * Generic LoopBack 3 proxy routes.
 *
 * Forwards any request to /api/lb/* → LoopBack 3 /api/*
 * Preserves method, path, query params, and body.
 *
 * Examples:
 *   GET  /api/lb/Instruments        → GET  /api/Instruments
 *   POST /api/lb/Orders             → POST /api/Orders
 *   GET  /api/lb/ClientDashboard/201/fetchDashboardData?fromDate=...
 *        → GET /api/ClientDashboard/201/fetchDashboardData?fromDate=...
 */
async function proxyRoutes(fastify) {
  // Catch-all route for any method and path under /api/lb/*
  fastify.all('/*', async (request, reply) => {
    // Extract the path after /api/lb/ prefix
    const lbPath = request.params['*'];

    if (!lbPath) {
      reply.code(400).send({
        error: 'Bad Request',
        message: 'Please provide a LoopBack API path. Example: /api/lb/Instruments',
      });
      return;
    }

    try {
      const result = await proxyToLoopback({
        method: request.method,
        path: lbPath,
        token: request.lbToken,
        query: request.query,
        body: request.body,
      });

      reply.code(result.status).send(result.data);
    } catch (err) {
      request.log.error(err, 'LoopBack proxy request failed');
      reply.code(502).send({
        error: 'Bad Gateway',
        message: 'Failed to reach LoopBack 3 API',
        detail: err.message,
      });
    }
  });
}

module.exports = proxyRoutes;
