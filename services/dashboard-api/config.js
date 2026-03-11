'use strict';

const config = {
  memcachedUrl: process.env.MEMCACHED_URL || 'localhost:11211',
  cacheTTL: parseInt(process.env.CACHE_TTL_SECONDS || '300', 10), // 5 minutes default
  lbBaseUrl: process.env.LB_BASE_URL || 'https://bm-rhel-second-staging.wealthfy.com/api',
  lbToken: process.env.LB_TOKEN || '',
  lbCookie: process.env.LB_COOKIE || '',
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
  ],
};

module.exports = config;
