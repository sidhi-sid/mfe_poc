'use strict';

require('dotenv').config();

const fastify = require('fastify')({ logger: true });
const cors = require('@fastify/cors');
const config = require('../shared/config');
const authPlugin = require('../shared/auth-plugin');
const dashboardRoutes = require('./routes/dashboard');

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
    service: 'dashboard-api',
    timestamp: new Date().toISOString(),
  }));

  // Dashboard routes
  await fastify.register(dashboardRoutes, { prefix: '/api' });

  // Start server
  const port = process.env.PORT || 4001;
  await fastify.listen({ port, host: '0.0.0.0' });
  fastify.log.info(`Dashboard API running on http://localhost:${port}`);
}

start().catch((err) => {
  console.error('Failed to start Dashboard API:', err);
  process.exit(1);
});
