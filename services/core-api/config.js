'use strict';

const config = {
  moduleJsonUrl: process.env.MODULE_JSON_URL || '',
  corsOrigins: [
    'http://localhost:5173',
    'http://localhost:5174',
    'http://localhost:5175',
  ],
};

module.exports = config;
