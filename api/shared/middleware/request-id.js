'use strict';

const fp = require('fastify-plugin');
const { randomUUID } = require('node:crypto');

/**
 * Fastify plugin that ensures every request has a unique ID.
 *
 * - Uses the incoming X-Request-Id header if present (for tracing across services).
 * - Otherwise generates a new UUID v4.
 * - Echoes the ID back in the response X-Request-Id header.
 */
async function requestIdPlugin(fastify) {
  fastify.addHook('onRequest', async (request, reply) => {
    // Fastify already generates request.id, but we want X-Request-Id propagation
    const incomingId = request.headers['x-request-id'];
    request.requestId = incomingId || randomUUID();
    reply.header('X-Request-Id', request.requestId);
  });
}

module.exports = fp(requestIdPlugin, { name: 'request-id' });
