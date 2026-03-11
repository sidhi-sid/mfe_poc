'use strict';

const config = require('./config');

/**
 * Proxy a request to the LoopBack 3 API.
 *
 * Sends both Authorization header (token) and Cookie header,
 * plus required custom headers (source, role, etc.) — exactly
 * matching the browser's request format.
 *
 * @param {object} options
 * @param {string} options.method   - HTTP method
 * @param {string} options.path     - LoopBack API path
 * @param {string} options.token    - LoopBack auth token
 * @param {object} [options.query]  - Query parameters object
 * @param {object} [options.body]   - Request body (for POST/PUT/PATCH)
 * @param {object} [options.headers] - Additional headers to forward
 * @returns {Promise<{ status: number, data: any, headers: object }>}
 */
async function proxyToLoopback({ method, path, token, query, body, headers = {} }) {
  // Build the URL
  const url = new URL(`${config.lbBaseUrl}/${path}`);

  // Append query parameters
  if (query) {
    for (const [key, value] of Object.entries(query)) {
      if (value !== undefined && value !== null) {
        url.searchParams.set(key, String(value));
      }
    }
  }

  // Build fetch headers — matching the browser exactly
  const fetchHeaders = {
    'Content-Type': 'application/json',
    'Accept': 'application/json, text/plain, */*',
    'Authorization': token,           // Auth token
    ...config.lbHeaders,              // source, role, roleid, languageIsoCode, modulecode
    ...headers,
  };

  // Add Cookie header if configured
  if (config.lbCookie) {
    fetchHeaders['Cookie'] = config.lbCookie;
  }

  const fetchOptions = {
    method: method.toUpperCase(),
    headers: fetchHeaders,
  };

  // Attach body for non-GET requests
  if (body && method.toUpperCase() !== 'GET' && method.toUpperCase() !== 'HEAD') {
    fetchOptions.body = JSON.stringify(body);
  }

  const response = await fetch(url.toString(), fetchOptions);

  // Try to parse as JSON, fall back to text
  let data;
  const contentType = response.headers.get('content-type') || '';
  if (contentType.includes('application/json')) {
    data = await response.json();
  } else {
    data = await response.text();
  }

  return {
    status: response.status,
    data,
    headers: Object.fromEntries(response.headers.entries()),
  };
}

module.exports = { proxyToLoopback };
