'use strict';

/**
 * Dashboard Service — Business Logic
 *
 * Contains widget configuration builders and LoopBack proxy calls
 * for the ClientDashboard API.
 */

const { proxyToLoopback } = require('@mfe/shared');

// ── Widget Configurations ───────────────────────────────────

/**
 * Build the widgetsToInclude for portfolio overview.
 * @returns {string} JSON string of widget config
 */
function buildPortfolioWidgets() {
  return JSON.stringify({
    portfolioSeries: {},
    portfolioSummary: {},
    timedTransactions: {},
    portfolioNetValue: {},
  });
}

/**
 * Build the widgetsToInclude for bank details.
 *
 * @param {number} clientId
 * @param {number} currencyId
 * @returns {string} JSON string of widget config
 */
function buildBankWidgets(clientId, currencyId) {
  return JSON.stringify({
    bankDetails: {
      filters: {
        accountId: [parseInt(clientId)],
        currencyId: parseInt(currencyId) || 247,
        offset: 0,
        limit: 5,
      },
    },
  });
}

// ── Service Methods ─────────────────────────────────────────

/**
 * Fetch portfolio dashboard data from LoopBack.
 *
 * @param {object} params
 * @param {string} params.clientId
 * @param {string} params.token
 * @param {object} params.query - fromDate, currencyId, contextFilter
 * @returns {Promise<object>}
 */
async function fetchPortfolio({ clientId, token, query }) {
  const lbPath = `ClientDashboard/${clientId}/fetchDashboardData`;

  return proxyToLoopback({
    method: 'GET',
    path: lbPath,
    token,
    query: {
      fromDate: query.fromDate || '2025-01-01',
      currencyId: query.currencyId || '247',
      contextFilter: query.contextFilter || JSON.stringify({ custodialAccountId: [1] }),
      widgetsToInclude: buildPortfolioWidgets(),
    },
  });
}

/**
 * Fetch bank details from LoopBack.
 *
 * @param {object} params
 * @param {string} params.clientId
 * @param {string} params.token
 * @param {object} params.query - fromDate, currencyId, contextFilter
 * @returns {Promise<object>}
 */
async function fetchBankDetails({ clientId, token, query }) {
  const lbPath = `ClientDashboard/${clientId}/fetchDashboardData`;

  return proxyToLoopback({
    method: 'GET',
    path: lbPath,
    token,
    query: {
      fromDate: query.fromDate || '2025-01-01',
      currencyId: query.currencyId || '247',
      contextFilter: query.contextFilter || JSON.stringify({ custodialAccountId: [1] }),
      widgetsToInclude: buildBankWidgets(clientId, query.currencyId),
    },
  });
}

/**
 * Generic fetch dashboard data — forwards all query params as-is.
 *
 * @param {object} params
 * @param {string} params.clientId
 * @param {string} params.token
 * @param {object} params.query - All query params forwarded to LoopBack
 * @returns {Promise<object>}
 */
async function fetchDashboardData({ clientId, token, query }) {
  const lbPath = `ClientDashboard/${clientId}/fetchDashboardData`;

  return proxyToLoopback({
    method: 'GET',
    path: lbPath,
    token,
    query,
  });
}

/**
 * Generic fetch for any ClientDashboard action.
 *
 * @param {object} params
 * @param {string} params.clientId
 * @param {string} params.action
 * @param {string} params.token
 * @param {object} params.query
 * @returns {Promise<object>}
 */
async function fetchClientAction({ clientId, action, token, query }) {
  const lbPath = `ClientDashboard/${clientId}/${action}`;

  return proxyToLoopback({
    method: 'GET',
    path: lbPath,
    token,
    query,
  });
}

module.exports = {
  fetchPortfolio,
  fetchBankDetails,
  fetchDashboardData,
  fetchClientAction,
};
