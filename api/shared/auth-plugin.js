'use strict';

const fp = require('fastify-plugin');
const config = require('./config');

/**
 * Fastify plugin that decorates each request with the LoopBack 3 auth token.
 *
 * - Adds `request.lbToken` for route handlers to use.
 * - If no token is configured, returns 401 (except for /health).
 */
async function authPlugin(fastify) {
  fastify.decorateRequest('lbToken', null);

  fastify.addHook('onRequest', async (request, reply) => {
    // Skip auth check for health endpoint
    if (request.url === '/health') return;

    const token = config.lbToken;
    if (!token) {
      reply.code(401).send({
        error: 'Unauthorized',
        message: 'LoopBack auth token not configured. Set LB_TOKEN in your .env file.',
      });
      return;
    }

    request.lbToken = token;
  });
}

module.exports = fp(authPlugin, {
  name: 'auth-plugin',
});
