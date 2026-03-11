'use strict';

const instrumentsController = require('../controllers/instrumentsController');

async function instrumentRoutes(fastify) {
  fastify.get('/instruments', instrumentsController.listInstruments);
  fastify.get('/instruments/:id', instrumentsController.getInstrumentById);
  fastify.post('/orders', instrumentsController.createOrder);
}

module.exports = instrumentRoutes;
