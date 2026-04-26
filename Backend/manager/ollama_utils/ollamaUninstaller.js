const { exec, spawn } = require('child_process');
const fs = require('fs');
const os = require('os');
const path = require('path');
/**
 * Silently uninstall Ollama on Windows.
 * Stops the server first, then runs the Inno Setup uninstaller with UAC elevation.
 *
 * @param {object} opts
 * @param {function} opts.onProgress      — called with progress events
 * @param {function} opts.invalidateCache — fn from OllamaManager
 * @returns {{ installed: false, running: false, models: [] }}
 */
async function uninstallOllama({ onProgress, invalidateCache } = {}) {
  if (process.platform !== 'win32') throw new Error('UNSUPPORTED_PLATFORM');

  // ── Step 1: Stop running Ollama processes ────────────────────────────────
  onProgress?.({ phase: 'stopping', message: 'Остановка сервера Ollama...' });
  await new Promise((resolve) => {
    exec('taskkill /f /im ollama.exe', { windowsHide: true }, () => resolve());
  });
  await new Promise((r) => setTimeout(r, 1000));

  // ── Step 2: Locate and run the uninstaller with UAC elevation ────────────
  onProgress?.({ phase: 'uninstalling', message: 'Подтвердите запрос прав (UAC)...' });

  const localAppData = process.env.LOCALAPPDATA || path.join(os.homedir(), 'AppData', 'Local');
  const knownUninstaller = path.join(localAppData, 'Programs', 'Ollama', 'unins000.exe');

  let psCommand;
  if (fs.existsSync(knownUninstaller)) {
    const escaped = knownUninstaller.replace(/'/g, "''");
    psCommand = `Start-Process -FilePath '${escaped}' -ArgumentList '/VERYSILENT','/NORESTART' -Verb RunAs -Wait`;
  } else {
    // Fall back to registry-based lookup
    psCommand = `
      $paths = @(
        'HKCU:\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\Uninstall\\Ollama',
        'HKLM:\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\Uninstall\\Ollama',
        'HKLM:\\SOFTWARE\\WOW6432Node\\Microsoft\\Windows\\CurrentVersion\\Uninstall\\Ollama'
      );
      $found = $false;
      foreach ($p in $paths) {
        $k = Get-ItemProperty $p -ErrorAction SilentlyContinue;
        if ($k -and $k.UninstallString) {
          $exe = ($k.UninstallString -split ' ')[0].Trim('"');
          Start-Process -FilePath $exe -ArgumentList '/VERYSILENT','/NORESTART' -Verb RunAs -Wait;
          $found = $true; break
        }
      };
      if (-not $found) { exit 1 }
    `;
  }

  await new Promise((resolve, reject) => {
    const ps = spawn('powershell', ['-NoProfile', '-NonInteractive', '-Command', psCommand], { windowsHide: true });
    ps.on('close', (code) => {
      if (code === 0) resolve();
      else reject(new Error(`UNINSTALL_FAILED: код ${code}. Попробуйте удалить вручную через Параметры → Приложения.`));
    });
    ps.on('error', reject);
  });

  invalidateCache?.();
  return { installed: false, running: false, models: [] };
}

module.exports = { uninstallOllama };
