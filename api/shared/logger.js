'use strict';

/**
 * Logger factory for microservices.
 * Uses pino (Fastify's built-in logger) with service-name context.
 *
 * @param {string} serviceName - Name of the calling service (e.g. 'oms-api')
 * @param {object} [opts] - Additional pino options
 * @returns {object} Pino logger options object for Fastify constructor
 */
function createLoggerOptions(serviceName, opts = {}) {
  return {
    level: process.env.LOG_LEVEL || 'info',
    name: serviceName,
    timestamp: () => `,"time":"${new Date().toISOString()}"`,
    ...opts,
  };
}

module.exports = { createLoggerOptions };
