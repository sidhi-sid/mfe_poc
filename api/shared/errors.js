'use strict';

const fp = require('fastify-plugin');

/**
 * Custom application error with HTTP status code.
 */
class AppError extends Error {
  /**
   * @param {string} message - Error message
   * @param {number} [statusCode=500] - HTTP status code
   * @param {string} [code='INTERNAL_ERROR'] - Machine-readable error code
   */
  constructor(message, statusCode = 500, code = 'INTERNAL_ERROR') {
    super(message);
    this.name = 'AppError';
    this.statusCode = statusCode;
    this.code = code;
  }
}

/**
 * Fastify plugin that registers a global error handler.
 * Handles AppError instances with their status codes,
 * and catches unexpected errors with a generic 500 response.
 */
async function errorHandlerPlugin(fastify) {
  fastify.setErrorHandler((error, request, reply) => {
    // Log the error
    request.log.error(error);

    // Handle known application errors
    if (error instanceof AppError) {
      reply.code(error.statusCode).send({
        error: error.code,
        message: error.message,
      });
      return;
    }

    // Handle Fastify validation errors
    if (error.validation) {
      reply.code(400).send({
        error: 'VALIDATION_ERROR',
        message: error.message,
        details: error.validation,
      });
      return;
    }

    // Handle unknown errors
    reply.code(error.statusCode || 500).send({
      error: 'INTERNAL_ERROR',
      message:
        process.env.NODE_ENV === 'production'
          ? 'An unexpected error occurred'
          : error.message,
    });
  });
}

module.exports = {
  AppError,
  errorHandlerPlugin: fp(errorHandlerPlugin, { name: 'error-handler' }),
};
