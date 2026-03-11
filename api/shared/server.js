'use strict';

require('dotenv').config();

const fastify = require('fastify')({ logger: true });
const cors = require('@fastify/cors');
const config = require('./config');
const moduleRoutes = require('./routes/modules');

async function start() {
  await fastify.register(cors, {
    origin: config.corsOrigins,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    credentials: true,
  });

  fastify.get('/health', async () => ({
    status: 'ok',
    service: 'shared-api',
    timestamp: new Date().toISOString(),
  }));

  await fastify.register(moduleRoutes, { prefix: '/api' });

  const port = process.env.PORT || 4000;
  await fastify.listen({ port, host: '0.0.0.0' });
  fastify.log.info(`Shared API running on http://localhost:${port}`);
  fastify.log.info(`GET http://localhost:${port}/api/modules — module config (set MODULE_JSON_URL to test)`);
}

start().catch((err) => {
  console.error('Failed to start Shared API:', err);
  process.exit(1);
});
