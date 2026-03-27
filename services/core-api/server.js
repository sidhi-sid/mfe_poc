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

  fastify.get('/', async () => ({
    status: 'ok',
    service: 'core-api',
    timestamp: new Date().toISOString(),
  }));

  await fastify.register(moduleRoutes, { prefix: '/api' });

  const port = process.env.PORT || 4000;
  await fastify.listen({ port, host: '0.0.0.0' });
  fastify.log.info(`Core API running on http://localhost:${port}`);
  fastify.log.info(`GET http://localhost:${port}/api/modules — module config (set MODULE_JSON_URL to use)`);
}

start().catch((err) => {
  console.error('Failed to start Core API:', err);
  process.exit(1);
});
