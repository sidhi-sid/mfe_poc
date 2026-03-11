'use strict';

require('dotenv').config();

const fastify = require('fastify')({ logger: true });
const cors = require('@fastify/cors');
const config = require('./config');
const authPlugin = require('./auth-plugin');
const proxyRoutes = require('./routes/proxy');
const instrumentRoutes = require('./routes/instruments');

async function start() {
  await fastify.register(cors, {
    origin: config.corsOrigins,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    credentials: true,
  });

  await fastify.register(authPlugin);

  fastify.get('/', async () => ({
    status: 'ok',
    service: 'oms-api',
    timestamp: new Date().toISOString(),
  }));

  await fastify.register(instrumentRoutes, { prefix: '/api' });
  await fastify.register(proxyRoutes, { prefix: '/api/lb' });

  const port = process.env.PORT || 4002;
  await fastify.listen({ port, host: '0.0.0.0' });
  fastify.log.info(`OMS API running on http://localhost:${port}`);
}

start().catch((err) => {
  console.error('Failed to start OMS API:', err);
  process.exit(1);
});
