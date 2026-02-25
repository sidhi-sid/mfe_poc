'use strict';

const { proxyToLoopback } = require('../../shared/lb-proxy');

/**
 * Dashboard routes.
 * Proxies dashboard data requests to the LoopBack 3 ClientDashboard API.
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
    const { fromDate, currencyId, contextFilter } = request.query;

    const lbPath = `ClientDashboard/${clientId}/fetchDashboardData`;

    const widgetsToInclude = JSON.stringify({
      portfolioSeries: {},
      portfolioSummary: {},
      timedTransactions: {},
      portfolioNetValue: {},
    });

    const result = await proxyToLoopback({
      method: 'GET',
      path: lbPath,
      token: request.lbToken,
      query: {
        fromDate: fromDate || '2025-01-01',
        currencyId: currencyId || '247',
        contextFilter: contextFilter || JSON.stringify({ custodialAccountId: [1] }),
        widgetsToInclude,
      },
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
    const { fromDate, currencyId, contextFilter } = request.query;

    const lbPath = `ClientDashboard/${clientId}/fetchDashboardData`;

    const widgetsToInclude = JSON.stringify({
      bankDetails: {
        filters: {
          accountId: [parseInt(clientId)],
          currencyId: parseInt(currencyId) || 247,
          offset: 0,
          limit: 5,
        },
      },
    });

    const result = await proxyToLoopback({
      method: 'GET',
      path: lbPath,
      token: request.lbToken,
      query: {
        fromDate: fromDate || '2025-01-01',
        currencyId: currencyId || '247',
        contextFilter: contextFilter || JSON.stringify({ custodialAccountId: [1] }),
        widgetsToInclude,
      },
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
    const lbPath = `ClientDashboard/${clientId}/fetchDashboardData`;

    const result = await proxyToLoopback({
      method: 'GET',
      path: lbPath,
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
