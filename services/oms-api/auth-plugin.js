'use strict';

const fp = require('fastify-plugin');
const config = require('./config');

async function authPlugin(fastify) {
  fastify.decorateRequest('lbToken', null);

  fastify.addHook('onRequest', async (request, reply) => {
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
