const { exec } = require('child_process');

/**
 * Start the Ollama server in the background and wait for it to bind.
 *
 * @param {object} opts
 * @param {function} opts.getStatus      — async fn from OllamaManager
 * @param {function} opts.invalidateCache — fn from OllamaManager
 * @returns {object} status object
 */
function startServer({ getStatus, invalidateCache, ollamaExec = 'ollama' } = {}) {
  return new Promise((resolve) => {
    const command = process.platform === 'win32'
      ? `start /b "" "${ollamaExec}" serve`
      : `${ollamaExec} serve &`;

    exec(command, { windowsHide: true }, () => {
      // Ignore exit code — fails harmlessly if already running
    });

    const checkStatus = async (attempt = 0) => {
      invalidateCache?.();
      const status = await getStatus();
      if (status.running || attempt >= 10) {
        resolve(status);
      } else {
        setTimeout(() => checkStatus(attempt + 1), 1000);
      }
    };

    setTimeout(() => checkStatus(0), 3000);
  });
}

/**
 * Stop the Ollama server process to free GPU memory.
 *
 * @param {object} opts
 * @param {function} opts.invalidateCache — fn from OllamaManager
 */
function stopServer({ invalidateCache } = {}) {
  invalidateCache?.();
  return new Promise((resolve) => {
    if (process.platform === 'win32') {
      exec('taskkill /f /t /im ollama_llama_server.exe 2>nul', { windowsHide: true }, () => {
        exec('taskkill /f /t /im ollama.exe 2>nul', { windowsHide: true }, () => resolve());
      });
    } else {
      exec("pkill -f 'ollama serve'", () => resolve());
    }
  });
}

module.exports = { startServer, stopServer };
