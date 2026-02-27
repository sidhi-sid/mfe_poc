'use strict';

const dashboardService = require('../services/dashboard');

/**
 * Dashboard routes.
 * Proxies dashboard data requests to the LoopBack 3 ClientDashboard API.
 * Business logic delegated to services/dashboard.js.
 */
async function dashboardRoutes(fastify) {
  /**
   * GET /api/dashboard/:clientId/portfolio
   *
   * Portfolio overview — called on home/dashboard page load.
   * Proxies to ClientDashboard/:clientId/fetchDashboardData with:
   *   widgetsToInclude = portfolioSeries, portfolioSummary, timedTransactions, portfolioNetValue
   */
  fastify.get('/dashboard/:clientId/portfolio', async (request, reply) => {
    const { clientId } = request.params;

    const result = await dashboardService.fetchPortfolio({
      clientId,
      token: request.lbToken,
      query: request.query,
    });

    reply.code(result.status).send(result.data);
  });

  /**
   * GET /api/dashboard/:clientId/bank
   *
   * Bank details — called for bank/savings info.
   * Proxies to ClientDashboard/:clientId/fetchDashboardData with:
   *   widgetsToInclude = bankDetails
   */
  fastify.get('/dashboard/:clientId/bank', async (request, reply) => {
    const { clientId } = request.params;

    const result = await dashboardService.fetchBankDetails({
      clientId,
      token: request.lbToken,
      query: request.query,
    });

    reply.code(result.status).send(result.data);
  });

  /**
   * GET /api/dashboard/:clientId
   *
   * Generic fetchDashboardData proxy.
   * Forwards all query params as-is (widgetsToInclude must be provided by caller).
   */
  fastify.get('/dashboard/:clientId', async (request, reply) => {
    const { clientId } = request.params;

    const result = await dashboardService.fetchDashboardData({
      clientId,
      token: request.lbToken,
      query: request.query,
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
    // Don't match our named routes
    if (action === 'portfolio' || action === 'bank') return;

    const result = await dashboardService.fetchClientAction({
      clientId,
      action,
      token: request.lbToken,
      query: request.query,
    });

    reply.code(result.status).send(result.data);
  });
}

module.exports = dashboardRoutes;
