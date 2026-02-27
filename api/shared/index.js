'use strict';

/**
 * @mfe/shared — Barrel export
 *
 * All shared utilities for the MFE backend microservices.
 * Import from '@mfe/shared' instead of relative paths.
 */

// Core modules
const config = require('./config');
const authPlugin = require('./auth-plugin');
const { proxyToLoopback } = require('./lb-proxy');

// Utilities
const { createLoggerOptions } = require('./logger');
const { AppError, errorHandlerPlugin } = require('./errors');
const { registerGracefulShutdown } = require('./graceful-shutdown');

// Middleware
const requestIdPlugin = require('./middleware/request-id');
const responseTimePlugin = require('./middleware/response-time');

module.exports = {
  // Core
  config,
  authPlugin,
  proxyToLoopback,

  // Utilities
  createLoggerOptions,
  AppError,
  errorHandlerPlugin,
  registerGracefulShutdown,

  // Middleware
  requestIdPlugin,
  responseTimePlugin,
};
