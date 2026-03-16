'use strict';

const { proxyToLoopback } = require('../lb-proxy');
const cache = require('../lib/redis-cache');

async function getPortfolio(request, reply) {
  const { clientId } = request.params;
  const { fromDate, currencyId, contextFilter } = request.query;

  const query = {
    fromDate: fromDate || '2025-01-01',
    currencyId: currencyId || '247',
    contextFilter: contextFilter || JSON.stringify({ custodialAccountId: [1] }),
    widgetsToInclude: JSON.stringify({
      portfolioSeries: {},
      portfolioSummary: {},
      timedTransactions: {},
      portfolioNetValue: {},
    }),
  };

  const cacheKey = cache.buildKey('portfolio', [clientId, cache.hashQuery(query)]);
  const cached = cache.isEnabled() ? await cache.get(cacheKey) : null;
  if (cached) {
    reply.code(cached.status).send(cached.data);
    return;
  }

  const lbPath = `ClientDashboard/${clientId}/fetchDashboardData`;
  const result = await proxyToLoopback({
    method: 'GET',
    path: lbPath,
    token: request.lbToken,
    query,
  });
  if (cache.isEnabled()) await cache.set(cacheKey, { status: result.status, data: result.data });
  reply.code(result.status).send(result.data);
}

async function getBank(request, reply) {
  const { clientId } = request.params;
  const { fromDate, currencyId, contextFilter } = request.query;

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
  const query = {
    fromDate: fromDate || '2025-01-01',
    currencyId: currencyId || '247',
    contextFilter: contextFilter || JSON.stringify({ custodialAccountId: [1] }),
    widgetsToInclude,
  };

  const cacheKey = cache.buildKey('bank', [clientId, cache.hashQuery(query)]);
  const cached = cache.isEnabled() ? await cache.get(cacheKey) : null;
  if (cached) {
    reply.code(cached.status).send(cached.data);
    return;
  }

  const lbPath = `ClientDashboard/${clientId}/fetchDashboardData`;
  const result = await proxyToLoopback({
    method: 'GET',
    path: lbPath,
    token: request.lbToken,
    query,
  });
  if (cache.isEnabled()) await cache.set(cacheKey, { status: result.status, data: result.data });
  reply.code(result.status).send(result.data);
}

async function getDashboardData(request, reply) {
  const { clientId } = request.params;
  const cacheKey = cache.buildKey('data', [clientId, cache.hashQuery(request.query)]);
  const cached = cache.isEnabled() ? await cache.get(cacheKey) : null;
  if (cached) {
    reply.code(cached.status).send(cached.data);
    return;
  }

  const lbPath = `ClientDashboard/${clientId}/fetchDashboardData`;
  const result = await proxyToLoopback({
    method: 'GET',
    path: lbPath,
    token: request.lbToken,
    query: request.query,
  });
  if (cache.isEnabled()) await cache.set(cacheKey, { status: result.status, data: result.data });
  reply.code(result.status).send(result.data);
}

async function getDashboardAction(request, reply) {
  const { clientId, action } = request.params;
  if (action === 'portfolio' || action === 'bank') return;

  const cacheKey = cache.buildKey('action', [clientId, action, cache.hashQuery(request.query)]);
  const cached = cache.isEnabled() ? await cache.get(cacheKey) : null;
  if (cached) {
    reply.code(cached.status).send(cached.data);
    return;
  }

  const lbPath = `ClientDashboard/${clientId}/${action}`;
  const result = await proxyToLoopback({
    method: 'GET',
    path: lbPath,
    token: request.lbToken,
    query: request.query,
  });
  if (cache.isEnabled()) await cache.set(cacheKey, { status: result.status, data: result.data });
  reply.code(result.status).send(result.data);
}

async function getWMURL(request, reply) {
  const query = {
    cifNumber: request.query.cifNumber,
    accountType: request.query.accountType,
  };
  const cacheKey = cache.buildKey('wmurl', [cache.hashQuery(query)]);
  const cached = cache.isEnabled() ? await cache.get(cacheKey) : null;
  if (cached) {
    reply.code(cached.status).send(cached.data);
    return;
  }

  const lbPath = `Onboarding/getWMURL`;
  const result = await proxyToLoopback({
    method: 'GET',
    path: lbPath,
    token: request.lbToken,
    query,
  });
  if (cache.isEnabled()) await cache.set(cacheKey, { status: result.status, data: result.data });
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

async function fetchAccountByCifNumber(request, reply) {
  const { cifNumber } = request.query;
  const cacheKey = cache.buildKey('account:cif', [cifNumber || '']);
  const cached = cache.isEnabled() ? await cache.get(cacheKey) : null;
  if (cached) {
    reply.code(cached.status).send(cached.data);
    return;
  }

  const lbPath = `Accounts/fetchAccountByCifNumber`;
  const result = await proxyToLoopback({
    method: 'GET',
    path: lbPath,
    token: request.lbToken,
    query: { cifNumber },
  });
  if (cache.isEnabled()) await cache.set(cacheKey, { status: result.status, data: result.data });
  reply.code(result.status).send(result.data);
}

module.exports = {
  getPortfolio,
  getBank,
  getDashboardData,
  getDashboardAction,
  getWMURL,
  authSelfOnboarding,
  fetchAccountByCifNumber,
};
