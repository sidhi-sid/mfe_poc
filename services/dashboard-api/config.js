'use strict';

const config = {
  lbBaseUrl: process.env.LB_BASE_URL || 'https://bm-rhel-second-staging.wealthfy.com/api',
  lbToken: process.env.LB_TOKEN || '',
  lbCookie: process.env.LB_COOKIE || '',
  redis: {
    url: process.env.REDIS_URL || 'redis://localhost:6379',
    ttlSeconds: parseInt(process.env.REDIS_TTL_SECONDS || '300', 10),
    enabled: process.env.REDIS_ENABLED !== 'false',
  },
  lbHeaders: {
    source: process.env.LB_SOURCE || 'web',
    version: process.env.LB_VERSION || '1.0.0',
    role: process.env.LB_ROLE || 'RELATIONSHIPMANAGER',
    roleid: process.env.LB_ROLE_ID || '2',
    languageIsoCode: process.env.LB_LANGUAGE || 'en',
    modulecode: process.env.LB_MODULE_CODE || '',
  },
  corsOrigins: [
    'http://localhost:5173',
    'http://localhost:5174',
    'http://localhost:5175',
    // Allow iframe-host shell to call onboarding APIs
    'http://localhost:5180',
  ],
};

module.exports = config;
