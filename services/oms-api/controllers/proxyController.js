'use strict';

const { proxyToLoopback } = require('../lb-proxy');

async function proxyToLoopbackHandler(request, reply) {
  const lbPath = request.params['*'];

  if (!lbPath) {
    reply.code(400).send({
      error: 'Bad Request',
      message: 'Please provide a LoopBack API path. Example: /api/lb/Instruments',
    });
    return;
  }

  try {
    const result = await proxyToLoopback({
      method: request.method,
      path: lbPath,
      token: request.lbToken,
      query: request.query,
      body: request.body,
    });

    reply.code(result.status).send(result.data);
  } catch (err) {
    request.log.error(err, 'LoopBack proxy request failed');
    reply.code(502).send({
      error: 'Bad Gateway',
      message: 'Failed to reach LoopBack 3 API',
      detail: err.message,
    });
  }
}

module.exports = {
  proxyToLoopbackHandler,
};
