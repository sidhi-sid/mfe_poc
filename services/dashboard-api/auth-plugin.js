'use strict';

const fp = require('fastify-plugin');
const config = require('./config');

async function authPlugin(fastify) {
  fastify.decorateRequest('lbToken', null);

  fastify.addHook('onRequest', async (request, reply) => {
    if (request.url === '/health') return;

    const pathname = request.url.split('?')[0];
    if (pathname === '/api/onboarding/getWMURL' || pathname === '/api/onboarding/authSelfOnboarding') return;

    // Use token from request (e.g. from authSelfOnboarding) or fall back to server config
    const token = request.headers.authorization || config.lbToken;
    if (!token) {
      reply.code(401).send({
        error: 'Unauthorized',
        message: 'Authorization required. Send Bearer token from authSelfOnboarding or set LB_TOKEN in .env.',
      });
      return;
    }

    request.lbToken = token;
  });
}

module.exports = fp(authPlugin, {
  name: 'auth-plugin',
});
