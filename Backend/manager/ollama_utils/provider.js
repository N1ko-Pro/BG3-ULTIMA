const { httpSimple } = require('./httpUtils');
const {
  OLLAMA_DEFAULT_BASE_URL,
  OLLAMA_API_TAGS,
  OLLAMA_API_PULL,
  OLLAMA_API_DELETE,
} = require('./constantsAI');
const http = require('http');

/**
 * Check if Ollama server is reachable and list installed models.
 * @returns {{ running: true, models: [] } | { running: false, error: string }}
 */
async function checkOllamaStatus(baseUrl = OLLAMA_DEFAULT_BASE_URL) {
  try {
    const { status, body } = await httpSimple(`${baseUrl}${OLLAMA_API_TAGS}`, 'GET', { timeoutMs: 5000 });
    if (status < 200 || status >= 300) return { running: false, error: `HTTP ${status}` };

    const data = JSON.parse(body);
    const models = Array.isArray(data.models)
      ? data.models.map((m) => ({
          name: m.name,
          size: m.size,
          modifiedAt: m.modified_at,
          digest: m.digest,
          family: m.details?.family || '',
          parameterSize: m.details?.parameter_size || '',
          quantization: m.details?.quantization_level || '',
        }))
      : [];
    return { running: true, models };
  } catch (error) {
    return { running: false, error: error?.message || 'Connection failed' };
  }
}

/**
 * Pull (download) a model from the Ollama registry.
 * Streams progress via onProgress({ status, completed, total }).
 */
async function pullOllamaModel(modelName, { baseUrl = OLLAMA_DEFAULT_BASE_URL, onProgress, cancelCtrl } = {}) {
  return new Promise((resolve, reject) => {
    const parsed = new URL(`${baseUrl}${OLLAMA_API_PULL}`);
    const bodyStr = JSON.stringify({ name: modelName, stream: true });

    const req = http.request({
      hostname: parsed.hostname,
      port: parsed.port,
      path: parsed.pathname,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(bodyStr, 'utf8'),
      },
    }, (res) => {
      if (res.statusCode < 200 || res.statusCode >= 300) {
        let errBody = '';
        res.on('data', (c) => (errBody += c));
        res.on('end', () => reject(new Error(`OLLAMA_PULL_HTTP_${res.statusCode}: ${errBody.slice(0, 300)}`)));
        return;
      }

      let buffer = '';
      res.on('data', (chunk) => {
        if (cancelCtrl?.cancelled) { res.destroy(); return; }
        buffer += chunk.toString('utf8');
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed) continue;
          try {
            const progress = JSON.parse(trimmed);
            onProgress?.({ status: progress.status || '', completed: progress.completed || 0, total: progress.total || 0 });
            if (progress.error) { reject(new Error(`OLLAMA_PULL_ERROR: ${progress.error}`)); req.destroy(); return; }
          } catch (parseError) {
            if (parseError.message.startsWith('OLLAMA_PULL_')) { reject(parseError); req.destroy(); return; }
          }
        }
      });
      res.on('end', () => {
        if (cancelCtrl?.cancelled) { reject(new Error('PULL_CANCELLED')); return; }
        resolve({ success: true });
      });
    });

    if (cancelCtrl) cancelCtrl.request = req;

    req.on('error', (err) => {
      if (cancelCtrl?.cancelled) { reject(new Error('PULL_CANCELLED')); return; }
      reject(err);
    });
    req.write(bodyStr, 'utf8');
    req.end();
  });
}

/**
 * Delete a model from Ollama.
 */
async function deleteOllamaModel(modelName, baseUrl = OLLAMA_DEFAULT_BASE_URL) {
  const bodyStr = JSON.stringify({ name: modelName });
  const { status, body } = await httpSimple(`${baseUrl}${OLLAMA_API_DELETE}`, 'DELETE', { timeoutMs: 30000, bodyStr });
  if (status < 200 || status >= 300) throw new Error(`OLLAMA_DELETE_HTTP_${status}: ${body.slice(0, 300)}`);
  return { success: true };
}

module.exports = { checkOllamaStatus, pullOllamaModel, deleteOllamaModel };
