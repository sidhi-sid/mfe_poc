'use strict';

const config = require('./config');

async function proxyToLoopback({ method, path, token, query, body, headers = {} }) {
  const url = new URL(`${config.lbBaseUrl}/${path}`);

  if (query) {
    for (const [key, value] of Object.entries(query)) {
      if (value !== undefined && value !== null) {
        url.searchParams.set(key, String(value));
      }
    }
  }

  const fetchHeaders = {
    'Content-Type': 'application/json',
    'Accept': 'application/json, text/plain, */*',
    'Authorization': token,
    ...config.lbHeaders,
    ...headers,
  };

  if (config.lbCookie) {
    fetchHeaders['Cookie'] = config.lbCookie;
  }

  const fetchOptions = {
    method: method.toUpperCase(),
    headers: fetchHeaders,
  };

  if (body && method.toUpperCase() !== 'GET' && method.toUpperCase() !== 'HEAD') {
    fetchOptions.body = JSON.stringify(body);
  }

  const response = await fetch(url.toString(), fetchOptions);

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
