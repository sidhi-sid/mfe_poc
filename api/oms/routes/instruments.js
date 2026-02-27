'use strict';

const { AppError } = require('@mfe/shared');
const instrumentService = require('../services/instrument');

/**
 * Instrument-related OMS routes.
 *
 * Delegates business logic to services/instrument.js.
 * Currently uses mock data. When LoopBack 3 endpoints are identified,
 * update the service layer to call proxyToLoopback() instead.
 */
async function instrumentRoutes(fastify) {
  /**
   * GET /api/instruments
   *
   * Returns the list of available instruments.
   * TODO: Replace with LoopBack 3 proxy call when endpoint is known.
   *
   * Query params (optional):
   *   - search — filter by name, ticker, or asset type
   */
  fastify.get('/instruments', async (request, reply) => {
    const { search } = request.query;
    const instruments = instrumentService.getInstruments(search);
    reply.send(instruments);
  });

  /**
   * GET /api/instruments/:id
   *
   * Returns a single instrument by ID.
   */
  fastify.get('/instruments/:id', async (request, reply) => {
    const { id } = request.params;
    const instrument = instrumentService.getInstrumentById(id);

    if (!instrument) {
      throw new AppError(`Instrument ${id} not found`, 404, 'NOT_FOUND');
    }

    reply.send(instrument);
  });

  /**
   * POST /api/orders
   *
   * Creates an order. Currently simulates order placement.
   * TODO: Replace with LoopBack 3 proxy call when order endpoint is known.
   */
  fastify.post('/orders', async (request, reply) => {
    const orderData = request.body;

    if (!orderData || !orderData.instrumentId || !orderData.transactionType) {
      throw new AppError(
        'instrumentId and transactionType are required',
        400,
        'VALIDATION_ERROR'
      );
    }

    const result = await instrumentService.placeOrder(orderData);

    if (result.status === 'success') {
      reply.code(201).send(result);
    } else {
      reply.code(500).send(result);
    }
  });
}

module.exports = instrumentRoutes;
