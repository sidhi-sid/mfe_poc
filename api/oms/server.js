'use strict';

require('dotenv').config();

const fastify = require('fastify')({ logger: true });
const cors = require('@fastify/cors');
const config = require('../shared/config');
const authPlugin = require('../shared/auth-plugin');
const proxyRoutes = require('./routes/proxy');
const instrumentRoutes = require('./routes/instruments');

async function start() {
  // CORS — allow MFE origins
  await fastify.register(cors, {
    origin: config.corsOrigins,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    credentials: true,
  });

  // Auth plugin — adds lbToken to every request
  await fastify.register(authPlugin);

  // Health check
  fastify.get('/health', async () => ({
    status: 'ok',
    service: 'oms-api',
    timestamp: new Date().toISOString(),
  }));

  // OMS-specific routes
  await fastify.register(instrumentRoutes, { prefix: '/api' });

  // Generic LoopBack proxy (catch-all for any LoopBack endpoint)
  await fastify.register(proxyRoutes, { prefix: '/api/lb' });

  // Start server
  const port = process.env.PORT || 4002;
  await fastify.listen({ port, host: '0.0.0.0' });
  fastify.log.info(`OMS API running on http://localhost:${port}`);
}

start().catch((err) => {
  console.error('Failed to start OMS API:', err);
  process.exit(1);
});
