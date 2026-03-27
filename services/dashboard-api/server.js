'use strict';

require('dotenv').config();

const fastify = require('fastify')({ logger: true });
const cors = require('@fastify/cors');
const config = require('./config');
const authPlugin = require('./auth-plugin');
const dashboardRoutes = require('./routes/dashboard');
const redisCache = require('./lib/redis-cache');

async function start() {
  if (config.redis.enabled) {
    const connected = await redisCache.connect();
    fastify.log.info(connected ? 'Redis cache connected' : 'Redis cache disabled');
  }

  fastify.addHook('onClose', async () => {
    await redisCache.disconnect();
  });

  await fastify.register(cors, {
    origin: config.corsOrigins,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    credentials: true,
  });

  await fastify.register(authPlugin);

  fastify.get('/health', async () => ({
    status: 'ok',
    service: 'dashboard-api',
    timestamp: new Date().toISOString(),
  }));

  await fastify.register(dashboardRoutes, { prefix: '/api' });

  const port = process.env.PORT || 4001;
  await fastify.listen({ port, host: '0.0.0.0' });
  fastify.log.info(`Dashboard API running on http://localhost:${port}`);
}

start().catch((err) => {
  console.error('Failed to start Dashboard API:', err);
  process.exit(1);
});
