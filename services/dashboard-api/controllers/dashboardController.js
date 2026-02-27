'use strict';

const { proxyToLoopback } = require('../lb-proxy');

async function getPortfolio(request, reply) {
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
}

async function getBank(request, reply) {
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

module.exports = {
  getPortfolio,
  getBank,
  getDashboardData,
  getDashboardAction,
};
