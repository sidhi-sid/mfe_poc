'use strict';

const proxyController = require('../controllers/proxyController');

async function proxyRoutes(fastify) {
  fastify.all('/*', proxyController.proxyToLoopbackHandler);
}

module.exports = proxyRoutes;
