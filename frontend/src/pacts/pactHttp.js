/**
 * Minimal HTTP client for Pact consumer tests (Node, no fetch required).
 */

const http = require('http');

/**
 * @param {'GET'|'POST'|'PUT'|'DELETE'} method
 * @param {number} port
 * @param {string} path
 * @param {Record<string, unknown> | null} [bodyObj]
 * @param {Record<string, string>} [extraHeaders]
 */
function requestJson(method, port, path, bodyObj = null, extraHeaders = {}) {
  const body = bodyObj != null ? JSON.stringify(bodyObj) : null;
  const headers = { ...extraHeaders };
  if (body != null) {
    headers['Content-Type'] = headers['Content-Type'] || 'application/json';
    headers['Content-Length'] = String(Buffer.byteLength(body));
  }

  return new Promise((resolve, reject) => {
    const req = http.request(
      { hostname: '127.0.0.1', port, path, method, headers },
      (res) => {
        let raw = '';
        res.setEncoding('utf8');
        res.on('data', (c) => {
          raw += c;
        });
        res.on('end', () => {
          resolve({
            status: res.statusCode,
            headers: res.headers,
            json: () => JSON.parse(raw || '{}'),
            text: () => raw,
          });
        });
      }
    );
    req.on('error', reject);
    if (body != null) req.write(body);
    req.end();
  });
}

function getJson(port, path, headers = {}) {
  return requestJson('GET', port, path, null, headers);
}

function postJson(port, path, bodyObj, headers = {}) {
  return requestJson('POST', port, path, bodyObj, headers);
}

module.exports = { requestJson, getJson, postJson };
