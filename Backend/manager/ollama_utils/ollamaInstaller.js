const { spawn } = require('child_process');
const https = require('https');
const http = require('http');
const fs = require('fs');
const os = require('os');
const path = require('path');

/**
 * Download a file with redirect support, progress reporting, and cancellation.
 * @param {string} url
 * @param {string} destPath
 * @param {function} onProgress  — called with { percent, speedMBps }
 * @param {{ cancelled, request }} cancelCtrl — shared cancellation object
 */
function downloadFile(url, destPath, onProgress, cancelCtrl = {}) {
  return new Promise((resolve, reject) => {
    let redirectCount = 0;
    let attempt = 0;
    const maxAttempts = 3;
    const retryDelayMs = 1000;
    const retryStatusCodes = new Set([408, 429, 500, 502, 503, 504]);
    const transientNetworkCodes = new Set([
      'ECONNRESET', 'ENOTFOUND', 'EAI_AGAIN', 'ETIMEDOUT', 'EPIPE', 'ECONNREFUSED', 'EHOSTUNREACH', 'ECONNABORTED', 'HPE_HEADER_OVERFLOW',
    ]);

    const scheduleRetry = (requestUrl) => {
      if (cancelCtrl.cancelled) { reject(new Error('INSTALL_CANCELLED')); return false; }
      attempt += 1;
      if (attempt < maxAttempts) {
        const delay = retryDelayMs * attempt;
        setTimeout(() => makeRequest(requestUrl), delay);
        return true;
      }
      return false;
    };

    const makeRequest = (requestUrl) => {
      if (cancelCtrl.cancelled) { reject(new Error('INSTALL_CANCELLED')); return; }
      if (redirectCount > 10) { reject(new Error('TOO_MANY_REDIRECTS')); return; }

      const protocol = requestUrl.startsWith('https') ? https : http;
      const request = protocol.get(
        requestUrl,
        { headers: { 'User-Agent': 'BG3-ULTIMA-Translator/2.0' } },
        (response) => {
          if (cancelCtrl.cancelled) { response.destroy(); reject(new Error('INSTALL_CANCELLED')); return; }

          const REDIRECT_CODES = [301, 302, 303, 307, 308];
          if (REDIRECT_CODES.includes(response.statusCode) && response.headers.location) {
            redirectCount += 1;
            response.resume();
            makeRequest(response.headers.location);
            return;
          }

          if (response.statusCode !== 200) {
            if (retryStatusCodes.has(response.statusCode) && scheduleRetry(requestUrl)) {
              response.resume();
              return;
            }
            reject(new Error(`DOWNLOAD_HTTP_${response.statusCode}`));
            return;
          }

          const totalSize = parseInt(response.headers['content-length'] || '0', 10);
          let downloaded = 0;
          let speedWindowBytes = 0;
          let speedWindowStart = Date.now();
          let speedMBps = 0;
          const fileStream = fs.createWriteStream(destPath);

          response.on('data', (chunk) => {
            if (cancelCtrl.cancelled) {
              response.destroy();
              fileStream.destroy();
              reject(new Error('INSTALL_CANCELLED'));
              return;
            }
            downloaded += chunk.length;
            speedWindowBytes += chunk.length;

            const now = Date.now();
            const elapsed = now - speedWindowStart;
            if (elapsed >= 500) {
              speedMBps = (speedWindowBytes / elapsed) * 1000 / (1024 * 1024);
              speedWindowBytes = 0;
              speedWindowStart = now;
            }

            if (totalSize > 0) {
              onProgress?.({ percent: Math.round((downloaded / totalSize) * 100), speedMBps });
            }
          });

          response.pipe(fileStream);
          response.on('error', (err) => {
            fileStream.destroy();
            if (cancelCtrl.cancelled) reject(new Error('INSTALL_CANCELLED'));
            else reject(err);
          });
          fileStream.on('finish', () => {
            if (cancelCtrl.cancelled) { reject(new Error('INSTALL_CANCELLED')); return; }
            fileStream.close(() => resolve());
          });
          fileStream.on('error', (err) => {
            fs.unlink(destPath, () => {});
            reject(err);
          });
        }
      );

      cancelCtrl.request = request;
      request.on('error', (err) => {
        if (cancelCtrl.cancelled) { reject(new Error('INSTALL_CANCELLED')); return; }
        if (err?.code && transientNetworkCodes.has(err.code) && scheduleRetry(requestUrl)) {
          return;
        }
        reject(err);
      });
    };

    makeRequest(url);
  });
}

/**
 * Best-effort cleanup of a partial Ollama install by running the Inno Setup uninstaller.
 * Fire-and-forget; waits for OllamaSetup.exe to die first.
 * @param {function} invalidateCache
 */
async function cleanupPartialInstall(invalidateCache, { skipDelay = false } = {}) {
  const localAppData = process.env.LOCALAPPDATA || path.join(os.homedir(), 'AppData', 'Local');
  const uninstaller = path.join(localAppData, 'Programs', 'Ollama', 'unins000.exe');

  // skipDelay=true when the installer process has already exited (caller confirmed it)
  if (!skipDelay) await new Promise((r) => setTimeout(r, 2000));

  const ollamaDir = path.join(localAppData, 'Programs', 'Ollama');

  if (fs.existsSync(uninstaller)) {
    try {
      await new Promise((resolve) => {
        const ps = spawn('powershell', [
          '-NoProfile', '-NonInteractive', '-Command',
          `Start-Process -FilePath '${uninstaller.replace(/'/g, "''")}' -ArgumentList '/VERYSILENT','/NORESTART','/SUPPRESSMSGBOXES' -Verb RunAs -Wait`,
        ], { windowsHide: true });
        ps.on('close', () => resolve());
        ps.on('error', () => resolve());
      });
    } catch { /* best effort */ }
  }

  // Fallback: if the uninstaller didn't exist or left files behind, wipe the dir
  if (fs.existsSync(ollamaDir)) {
    try { fs.rmSync(ollamaDir, { recursive: true, force: true }); } catch { /* best effort */ }
  }

  invalidateCache?.();
}

/**
 * Download and silently install Ollama on Windows.
 *
 * @param {object} opts
 * @param {function} opts.onProgress       — called with progress events
 * @param {{ cancelled, request, process }} opts.cancelCtrl — shared mutable cancellation object
 * @param {function} opts.getStatus        — async fn from OllamaManager
 * @param {function} opts.invalidateCache  — fn from OllamaManager
 * @returns {object}  status object, or { cancelled: true }
 */
async function installOllama({ onProgress, cancelCtrl, getStatus, invalidateCache, startServer } = {}) {
  if (process.platform !== 'win32') throw new Error('UNSUPPORTED_PLATFORM');

  const installerPath = path.join(os.tmpdir(), 'OllamaSetup.exe');
  const downloadUrl = 'https://ollama.com/download/OllamaSetup.exe';

  try {
    // ── Phase 1: Download ────────────────────────────────────────────────────
    onProgress?.({ phase: 'downloading', percent: 0, message: 'Загрузка установщика Ollama...' });

    await downloadFile(downloadUrl, installerPath, ({ percent, speedMBps }) => {
      if (cancelCtrl.cancelled) return;
      onProgress?.({ phase: 'downloading', percent, speedMBps, message: `Загрузка установщика... ${percent}%` });
    }, cancelCtrl);

    if (cancelCtrl.cancelled) {
      try { fs.unlinkSync(installerPath); } catch { /* best effort */ }
      return { cancelled: true };
    }

    // ── Phase 2: Silent install via PowerShell + UAC elevation ───────────────
    onProgress?.({ phase: 'installing', percent: 100, message: 'Подтвердите запрос прав администратора (UAC)...' });

    // Signal-file approach: an elevated .ps1 script starts OllamaSetup.exe
    // with -PassThru and polls for a signal file every 300 ms. When
    // cancelInstall() writes the file, the elevated script calls Stop-Process
    // from within its own session — which works, unlike unelevated taskkill.
    const CANCEL_CODE = 99;
    const signalPath = path.join(os.tmpdir(), 'bg3_ollama_cancel.signal');
    const scriptPath = path.join(os.tmpdir(), 'bg3_ollama_install.ps1');
    try { fs.unlinkSync(signalPath); } catch { /* ignore stale */ }
    cancelCtrl.signalPath = signalPath;

    const UAC_DECLINED_CODE = 98;

    fs.writeFileSync(scriptPath, [
      `$sig = '${signalPath.replace(/'/g, "''")}'`,
      `$p = Start-Process -PassThru -FilePath '${installerPath.replace(/'/g, "''")}' -ArgumentList '/VERYSILENT','/NORESTART','/SUPPRESSMSGBOXES'`,
      `while (-not $p.HasExited) {`,
      `  if (Test-Path $sig) {`,
      // taskkill /f /t kills the entire process tree (including the Inno Setup
      // child "Setup/Uninstall 32-bit"). This works because we are already
      // running inside the elevated session — no privilege barrier.
      `    taskkill /f /t /pid $($p.Id) 2>$null`,
      // Give processes a moment to release file locks,
      // then wipe the Ollama directory while still elevated (no second UAC).
      `    Start-Sleep -Milliseconds 800`,
      `    $od = "$env:LOCALAPPDATA\\Programs\\Ollama"`,
      `    if (Test-Path $od) { Remove-Item -Path $od -Recurse -Force -ErrorAction SilentlyContinue }`,
      `    Remove-Item $sig -Force -ErrorAction SilentlyContinue`,
      `    exit ${CANCEL_CODE}`,
      `  }`,
      `  Start-Sleep -Milliseconds 300`,
      `}`,
      // After successful install, kill any Ollama GUI window the installer
      // auto-launched. Running from elevated session so Stop-Process works.
      `if ($p.ExitCode -eq 0) {`,
      `  Start-Sleep -Milliseconds 2000`,
      `  Get-Process | Where-Object { $_.Name -match '^ollama' } | Stop-Process -Force -ErrorAction SilentlyContinue`,
      `}`,
      `exit $p.ExitCode`,
    ].join('\r\n'), 'utf8');

    const escapedScript = scriptPath.replace(/'/g, "''");
    // UAC_DECLINED_CODE (98): outer PS caught an exception — user declined UAC
    // CANCEL_CODE (99):       inner script saw the signal file — user cancelled in UI
    const installerExitCode = await new Promise((resolve) => {
      const ps = spawn('powershell', [
        '-NoProfile', '-NonInteractive', '-Command',
        `try { $p = Start-Process -Verb RunAs -PassThru -WindowStyle Hidden -FilePath powershell -ArgumentList @('-NoProfile','-NonInteractive','-ExecutionPolicy','Bypass','-File','${escapedScript}'); $p.WaitForExit(); exit $p.ExitCode } catch { exit ${UAC_DECLINED_CODE} }`,
      ], { windowsHide: true });
      cancelCtrl.process = ps;
      ps.on('close', (code) => resolve(code ?? -1));
      ps.on('error', () => resolve(-1));
    });

    // Cleanup temp files
    try { fs.unlinkSync(scriptPath); } catch { /* ignore */ }
    try { fs.unlinkSync(signalPath); } catch { /* ignore */ }

    // Cancelled via signal file (user pressed cancel in UI)
    if (installerExitCode === CANCEL_CODE || cancelCtrl.cancelled) {
      try { fs.unlinkSync(installerPath); } catch { /* best effort */ }
      await cleanupPartialInstall(invalidateCache, { skipDelay: true });
      return { cancelled: true };
    }

    // UAC was declined by user — treat as a soft cancel so the UI resets
    // to the "Install" button without an error message (user can retry)
    if (installerExitCode === UAC_DECLINED_CODE) {
      return { cancelled: true };
    }

    if (installerExitCode !== 0) {
      throw new Error(`INSTALL_FAILED: код ${installerExitCode}.`);
    }

    invalidateCache?.();
    // Auto-start the server right after install so the UI lands on the
    // model management screen instead of the "server not running" screen.
    if (startServer) {
      await startServer();
    }
    const status = await getStatus();
    onProgress?.({ phase: 'complete', percent: 100, message: 'Ollama успешно установлен!' });
    return status;
  } catch (err) {
    try { fs.unlinkSync(installerPath); } catch { /* best effort */ }
    if (err.message === 'INSTALL_CANCELLED' || cancelCtrl.cancelled) return { cancelled: true };
    if (typeof err.message === 'string' && err.message.startsWith('DOWNLOAD_HTTP_')) {
      const httpCode = err.message.split('_')[2];
      const messageMap = {
        '500': 'Ошибка загрузки: внутренний сбой сервера Ollama. Попробуйте позже.',
        '502': 'Ошибка загрузки: плохой ответ от сервера. Попробуйте позже.',
        '503': 'Ошибка загрузки: сервис временно недоступен. Попробуйте позже.',
        '504': 'Ошибка загрузки: сервер не отвечает. Проверьте подключение и повторите.',
      };
      throw new Error(messageMap[httpCode] || `Ошибка загрузки: HTTP ${httpCode}.`);
    }
    throw err;
  }
}

module.exports = { installOllama };
