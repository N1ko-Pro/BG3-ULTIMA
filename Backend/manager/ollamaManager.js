const { exec } = require("child_process");
const fs = require("fs");
const os = require("os");
const path = require("path");
const { OLLAMA_DEFAULT_BASE_URL } = require("./ollama_utils/constantsAI");
const {
  checkOllamaStatus,
  pullOllamaModel,
  deleteOllamaModel,
} = require("./ollama_utils/provider");
const { installOllama } = require("./ollama_utils/ollamaInstaller");
const { uninstallOllama } = require("./ollama_utils/ollamaUninstaller");
const { startServer, stopServer } = require("./ollama_utils/ollamaServer");
const { resetOllamaContext } = require("./ollama_utils/ollamaChat");

class OllamaManager {
  constructor() {
    this.baseUrl = OLLAMA_DEFAULT_BASE_URL;
    this._cachedStatus = null;
    this._statusTimestamp = 0;
    this._installCancelCtrl = null;
    this._pullCancelCtrl = null;
    this._activePullModel = null;
  }

  // ── Cancel ─────────────────────────────────────────────────────────────────

  cancelPull() {
    if (!this._pullCancelCtrl) return;
    this._pullCancelCtrl.cancelled = true;
    if (this._pullCancelCtrl.request) {
      try { this._pullCancelCtrl.request.destroy(); } catch { /* best effort */ }
    }
    this._activePullModel = null;
  }

  cancelInstall() {
    if (!this._installCancelCtrl) return;
    this._installCancelCtrl.cancelled = true;
    // Phase 1 (download): destroy the HTTP request stream
    if (this._installCancelCtrl.request) {
      try { this._installCancelCtrl.request.destroy(); } catch { /* best effort */ }
    }
    // Phase 2 (install): write the signal file that the elevated PS script
    // polls for; Stop-Process runs inside the elevated session so it can
    // actually kill OllamaSetup.exe (unelevated taskkill cannot).
    if (this._installCancelCtrl.signalPath) {
      try { fs.writeFileSync(this._installCancelCtrl.signalPath, 'cancel', 'utf8'); } catch { /* best effort */ }
    }
  }

  // ── Filesystem helpers ──────────────────────────────────────────────────────

  _getOllamaModelsDir() {
    const home = process.env.USERPROFILE || os.homedir();
    return path.join(home, '.ollama', 'models');
  }

  /**
   * Delete blob files in ~/.ollama/models/blobs/ that are NOT referenced
   * by any installed model manifest. This cleans up partial downloads
   * that were cancelled before Ollama wrote their manifest.
   */
  async pruneOrphanBlobs() {
    const modelsDir = this._getOllamaModelsDir();
    const blobsDir = path.join(modelsDir, 'blobs');
    const manifestsDir = path.join(modelsDir, 'manifests');

    if (!fs.existsSync(blobsDir)) return;

    // Collect all blob filenames referenced by existing complete manifests
    const referencedBlobs = new Set();
    if (fs.existsSync(manifestsDir)) {
      const walkDir = (dir) => {
        for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
          const fullPath = path.join(dir, entry.name);
          if (entry.isDirectory()) {
            walkDir(fullPath);
          } else {
            try {
              const manifest = JSON.parse(fs.readFileSync(fullPath, 'utf8'));
              const layers = [...(manifest.layers || [])];
              if (manifest.config) layers.push(manifest.config);
              for (const layer of layers) {
                if (layer?.digest) referencedBlobs.add(layer.digest.replace(':', '-'));
              }
            } catch { /* ignore corrupt/non-json files */ }
          }
        }
      };
      try { walkDir(manifestsDir); } catch { /* best effort */ }
    }

    // Delete any blob not referenced by any manifest (orphan from cancelled pull)
    try {
      for (const blobFile of fs.readdirSync(blobsDir)) {
        if (!referencedBlobs.has(blobFile)) {
          try { fs.unlinkSync(path.join(blobsDir, blobFile)); } catch { /* best effort */ }
        }
      }
    } catch { /* best effort */ }
  }

  // ── Detection ──────────────────────────────────────────────────────────────

  _getKnownOllamaPaths() {
    const localAppData = process.env.LOCALAPPDATA || path.join(os.homedir(), "AppData", "Local");
    return [
      path.join(localAppData, "Programs", "Ollama", "ollama.exe"),
      path.join("C:\\Program Files", "Ollama", "ollama.exe"),
    ];
  }

  async isInstalled() {
    if (process.platform === "win32") {
      if (this._getKnownOllamaPaths().some((p) => fs.existsSync(p))) return true;
    }
    return new Promise((resolve) => {
      exec(process.platform === "win32" ? "where ollama" : "which ollama", (error) => {
        resolve(!error);
      });
    });
  }

  async getStatus() {
    const now = Date.now();
    if (this._cachedStatus && now - this._statusTimestamp < 3000) return this._cachedStatus;

    const installed = await this.isInstalled();
    if (!installed) {
      this._cachedStatus = { installed: false, running: false, models: [] };
      this._statusTimestamp = now;
      return this._cachedStatus;
    }

    const status = await checkOllamaStatus(this.baseUrl);
    this._cachedStatus = {
      installed: true,
      running: status.running,
      models: status.models || [],
      pullingModel: this._activePullModel,
      error: status.error,
    };
    this._statusTimestamp = now;
    return this._cachedStatus;
  }

  // ── Models ─────────────────────────────────────────────────────────────────

  async pullModel(modelName, { onProgress } = {}) {
    this._invalidateCache();
    const cancelCtrl = { cancelled: false, request: null };
    this._pullCancelCtrl = cancelCtrl;
    this._activePullModel = modelName;
    try {
      const res = await pullOllamaModel(modelName, { baseUrl: this.baseUrl, onProgress, cancelCtrl });
      return res;
    } finally {
      this._pullCancelCtrl = null;
      this._activePullModel = null;
    }
  }

  async deleteModel(modelName) {
    this._invalidateCache();
    return deleteOllamaModel(modelName, this.baseUrl);
  }

  // ── Server ─────────────────────────────────────────────────────────────────

  _resolveOllamaExecutable() {
    if (process.platform !== 'win32') return 'ollama';
    const foundPath = this._getKnownOllamaPaths().find((p) => fs.existsSync(p));
    return foundPath || 'ollama';
  }

  startServer() {
    return startServer({
      getStatus: () => this.getStatus(),
      invalidateCache: () => this._invalidateCache(),
      ollamaExec: this._resolveOllamaExecutable(),
    });
  }

  stopServer() {
    return stopServer({ invalidateCache: () => this._invalidateCache() });
  }

  /**
   * Unload the model from GPU memory without stopping the server.
   * This frees VRAM and is the correct way to release resources after translation.
   */
  async resetContext(modelName) {
    if (!modelName) return false;
    return resetOllamaContext({ model: modelName, baseUrl: this.baseUrl });
  }

  /**
   * Ensure the Ollama server is running. If installed but stopped, start it.
   * Returns the current status. Safe to call multiple times.
   */
  async ensureRunning() {
    const status = await this.getStatus();
    if (!status.installed) return status;
    if (status.running) return status;
    return this.startServer();
  }

  // ── Install / Uninstall ────────────────────────────────────────────────────

  async installOllama({ onProgress } = {}) {
    const cancelCtrl = { cancelled: false, request: null, process: null };
    this._installCancelCtrl = cancelCtrl;
    try {
      return await installOllama({
        onProgress,
        cancelCtrl,
        getStatus: () => this.getStatus(),
        invalidateCache: () => this._invalidateCache(),
        startServer: () => this.startServer(),
      });
    } finally {
      this._installCancelCtrl = null;
    }
  }

  async uninstallOllama({ onProgress } = {}) {
    return uninstallOllama({
      onProgress,
      invalidateCache: () => this._invalidateCache(),
    });
  }

  // ── Internal ───────────────────────────────────────────────────────────────

  _invalidateCache() {
    this._cachedStatus = null;
    this._statusTimestamp = 0;
  }
}

module.exports = new OllamaManager();

