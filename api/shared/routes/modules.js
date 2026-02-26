'use strict';

const { getModuleConfig } = require('../module-config');

/**
 * Fastify plugin: GET /modules (register with prefix /api for GET /api/modules).
 * Returns module config (MFE registry) fetched from cloud-hosted module.json.
 * Used by Core to build navbar and routes. Register in any microservice that
 * should expose this to the frontend (e.g. dashboard, OMS, or a dedicated gateway).
 */
async function moduleRoutes(fastify) {
  fastify.get('/modules', async (_request, reply) => {
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
