'use strict';

const { proxyToLoopback } = require('../../shared/lb-proxy');

/**
 * Dashboard routes.
 * Proxies dashboard data requests to the LoopBack 3 ClientDashboard API.
 */
async function dashboardRoutes(fastify) {
  /**
   * GET /api/dashboard/:clientId
   *
   * Proxies to:
   *   LoopBack 3 → ClientDashboard/:clientId/fetchDashboardData
   *
   * Query params (forwarded as-is):
   *   - fromDate        (e.g. "2025-01-01")
   *   - contextFilter   (JSON string)
   *   - widgetsToInclude (JSON string)
   *   - currencyId       (e.g. 247)
   */
  fastify.get('/dashboard/:clientId', async (request, reply) => {
    const { clientId } = request.params;
    const { fromDate, contextFilter, widgetsToInclude, currencyId } = request.query;

    const lbPath = `ClientDashboard/${clientId}/fetchDashboardData`;

    const result = await proxyToLoopback({
      method: 'GET',
      path: lbPath,
      token: request.lbToken,
      query: { fromDate, contextFilter, widgetsToInclude, currencyId },
    });

    reply.code(result.status).send(result.data);
  });

  /**
   * GET /api/dashboard/:clientId/:action
   *
   * Generic proxy for any ClientDashboard action.
   * Forwards all query params to LoopBack 3.
   */
  fastify.get('/dashboard/:clientId/:action', async (request, reply) => {
    const { clientId, action } = request.params;
    const lbPath = `ClientDashboard/${clientId}/${action}`;

    const result = await proxyToLoopback({
      method: 'GET',
      path: lbPath,
      token: request.lbToken,
      query: request.query,
    });

    reply.code(result.status).send(result.data);
  });
}

module.exports = dashboardRoutes;
