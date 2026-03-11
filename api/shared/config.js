/**
 * Shared configuration for all Fastify API servers.
 * Reads from environment variables (loaded via dotenv in each server).
 */

const config = {
  /** LoopBack 3 API base URL (no trailing slash) */
  lbBaseUrl: process.env.LB_BASE_URL || 'https://bm-rhel-second-staging.wealthfy.com/api',

  /** LoopBack 3 auth token (from BM_WEALTH_MANAGEMENT login) — sent as Authorization header */
  lbToken: process.env.LB_TOKEN || '',

  /** LoopBack 3 cookie string (from browser session) — sent as Cookie header */
  lbCookie: process.env.LB_COOKIE || '',

  /**
   * Required custom headers for LoopBack 3 API.
   * These are mandatory — the API rejects requests without source/version.
   */
  lbHeaders: {
    source: process.env.LB_SOURCE || 'web',
    version: process.env.LB_VERSION || '1.0.0',
    role: process.env.LB_ROLE || 'RELATIONSHIPMANAGER',
    roleid: process.env.LB_ROLE_ID || '2',
    languageIsoCode: process.env.LB_LANGUAGE || 'en',
    modulecode: process.env.LB_MODULE_CODE || '',
  },

  /** Cloud-hosted module.json URL (MFE registry). Fetched by GET /api/modules. */
  moduleJsonUrl: process.env.MODULE_JSON_URL || '',

  /** Allowed CORS origins for MFE frontends */
  corsOrigins: [
    'http://localhost:5173', // Core shell
    'http://localhost:5174', // OMS MFE
    'http://localhost:5175', // Dashboard MFE
  ],
};

module.exports = config;
