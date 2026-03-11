'use strict';

const { proxyToLoopback } = require('../lb-proxy');
const { getCache, setCache, deleteCache } = require('../cache');

async function getPortfolio(request, reply) {
  const { clientId } = request.params;
  const { fromDate = '2025-01-01', currencyId = '247', contextFilter } = request.query;

  const cacheKey = `portfolio:${clientId}:${fromDate}:${currencyId}`;

  const cached = await getCache(cacheKey);
  if (cached) {
    request.log.info(`[cache] HIT ${cacheKey}`);
    return reply.send(cached);
  }

  request.log.info(`[cache] MISS ${cacheKey}`);

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
      fromDate,
      currencyId,
      contextFilter: contextFilter || JSON.stringify({ custodialAccountId: [1] }),
      widgetsToInclude,
    },
  });

  if (result.status === 200) {
    await setCache(cacheKey, result.data);
  }

  reply.code(result.status).send(result.data);
}

async function getBank(request, reply) {
  const { clientId } = request.params;
  const { fromDate = '2025-01-01', currencyId = '247', contextFilter } = request.query;

  const cacheKey = `bank:${clientId}:${fromDate}:${currencyId}`;

  const cached = await getCache(cacheKey);
  if (cached) {
    request.log.info(`[cache] HIT ${cacheKey}`);
    return reply.send(cached);
  }

  request.log.info(`[cache] MISS ${cacheKey}`);

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
      fromDate,
      currencyId,
      contextFilter: contextFilter || JSON.stringify({ custodialAccountId: [1] }),
      widgetsToInclude,
    },
  });

  if (result.status === 200) {
    await setCache(cacheKey, result.data);
  }

  reply.code(result.status).send(result.data);
}

async function getDashboardData(request, reply) {
  const { clientId } = request.params;
  const lbPath = `ClientDashboard/${clientId}/fetchDashboardData`;

  const result = await proxyToLoopback({
    method: 'GET',
    path: lbPath,
    token: request.lbToken,
    query: request.query,
  });

  reply.code(result.status).send(result.data);
}

async function getDashboardAction(request, reply) {
  const { clientId, action } = request.params;
  if (action === 'portfolio' || action === 'bank') return;

  const lbPath = `ClientDashboard/${clientId}/${action}`;

  const result = await proxyToLoopback({
    method: 'GET',
    path: lbPath,
    token: request.lbToken,
    query: request.query,
  });

  reply.code(result.status).send(result.data);
}

async function getWMURL(request, reply) {
  const lbPath = `Onboarding/getWMURL`;
  const result = await proxyToLoopback({
    method: 'GET',
    path: lbPath,
    token: request.lbToken,
    query: {
      cifNumber: request.query.cifNumber,
      accountType: request.query.accountType,
    },
  });
  reply.code(result.status).send(result.data);
}

async function authSelfOnboarding(request, reply) {
  const lbPath = `Onboarding/authSelfOnboarding`;
  const result = await proxyToLoopback({
    method: 'POST',
    path: lbPath,
    token: request.lbToken,
    body: request.body || {},
  });
  reply.code(result.status).send(result.data);
}

/**
 * Admin endpoint: DELETE /api/dashboard/:clientId/cache
 * Force-invalidates portfolio + bank cache for a client.
 */
async function invalidateClientCache(request, reply) {
  const { clientId } = request.params;
  const { fromDate = '2025-01-01', currencyId = '247' } = request.query;

  await Promise.all([
    deleteCache(`portfolio:${clientId}:${fromDate}:${currencyId}`),
    deleteCache(`bank:${clientId}:${fromDate}:${currencyId}`),
  ]);

  reply.send({ invalidated: true, clientId });
}

module.exports = {
  getPortfolio,
  getBank,
  getDashboardData,
  getDashboardAction,
  getWMURL,
  authSelfOnboarding,
  invalidateClientCache,
};
