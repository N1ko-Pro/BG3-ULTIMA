const http = require('http');

/**
 * Low-level HTTP GET/DELETE using Node.js http module.
 */
function httpSimple(urlStr, method = 'GET', { timeoutMs = 5000, bodyStr = null } = {}) {
  return new Promise((resolve, reject) => {
    const parsed = new URL(urlStr);
    const headers = {};
    if (bodyStr) {
      headers['Content-Type'] = 'application/json';
      headers['Content-Length'] = Buffer.byteLength(bodyStr, 'utf8');
    }

    const req = http.request({
      hostname: parsed.hostname,
      port: parsed.port,
      path: parsed.pathname,
      method,
      headers,
    }, (res) => {
      const chunks = [];
      res.on('data', (chunk) => chunks.push(chunk));
      res.on('end', () => resolve({ status: res.statusCode, body: Buffer.concat(chunks).toString('utf8') }));
    });

    req.on('error', reject);
    if (timeoutMs > 0) req.setTimeout(timeoutMs, () => req.destroy(new Error('OLLAMA_TIMEOUT')));
    if (bodyStr) req.write(bodyStr, 'utf8');
    req.end();
  });
}

module.exports = { httpSimple };
