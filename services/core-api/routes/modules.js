'use strict';

const { getModuleConfig } = require('../module-config');

async function moduleRoutes(fastify) {
  fastify.get('/modules', {
    preHandler: async (request, reply) => {
      const authHeader = request.headers.authorization;
      if (!authHeader || typeof authHeader !== 'string' || authHeader.trim() === '') {
        return reply.code(401).send({
          error: 'Unauthorized',
          message: 'Authorization required. Modules endpoint requires a valid token from authSelfOnboarding.',
        });
      }
    },
  }, async (request, reply) => {
    try {
      const data = await getModuleConfig();
      return reply.send(data);
    } catch (err) {
      fastify.log.error(err, 'Failed to fetch module config');
      return reply.code(502).send({
        error: 'Bad Gateway',
        message: 'Failed to fetch module config from cloud',
      });
    }
  });
}

module.exports = moduleRoutes;
