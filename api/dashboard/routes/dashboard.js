'use strict';

const dashboardController = require('../controllers/dashboardController');

async function dashboardRoutes(fastify) {
  fastify.get('/dashboard/:clientId/portfolio', dashboardController.getPortfolio);
  fastify.get('/dashboard/:clientId/bank', dashboardController.getBank);
  fastify.get('/dashboard/:clientId', dashboardController.getDashboardData);
  fastify.get('/dashboard/:clientId/:action', dashboardController.getDashboardAction);
}

module.exports = dashboardRoutes;
