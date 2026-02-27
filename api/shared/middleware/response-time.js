'use strict';

const fp = require('fastify-plugin');

/**
 * Fastify plugin that adds X-Response-Time header to every response.
 * Records the elapsed time in milliseconds from request start to response.
 */
async function responseTimePlugin(fastify) {
  fastify.addHook('onRequest', async (request) => {
    request.startTime = process.hrtime.bigint();
  });

  fastify.addHook('onSend', async (request, reply) => {
    if (request.startTime) {
      const elapsed = Number(process.hrtime.bigint() - request.startTime) / 1e6;
      reply.header('X-Response-Time', `${elapsed.toFixed(2)}ms`);
    }
  });
}

module.exports = fp(responseTimePlugin, { name: 'response-time' });
