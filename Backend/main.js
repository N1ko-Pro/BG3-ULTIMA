const { app, BrowserWindow, screen } = require('electron');
const path = require('path');
const { registerAllHandlers } = require('./handlers');
const bg3Manager = require('./manager/bg3Manager');
const smartManager = require('./manager/smartManager');
const projectManager = require('./manager/projectManager');
const dictionaryManager = require('./manager/dictionaryManager');
const ollamaManager = require('./manager/ollamaManager');
const aiManager = require('./manager/aiManager');
const authManager = require('./auth/authManager');
const firstRunManager = require('./manager/firstRunManager');
const updateManager = require('./manager/updateManager');

// Force userData to live under %APPDATA%\BG3 ULTIMA in all builds
// (dev + packaged), so we always know the on-disk location.
app.setName('BG3 ULTIMA');

// Suppress security warnings for local dev server (Content-Security-Policy)
process.env['ELECTRON_DISABLE_SECURITY_WARNINGS'] = 'true';

// Disable DirectComposition to avoid AMD VideoProcessorGetOutputExtension issues on some integrated GPUs.
app.commandLine.appendSwitch('disable-direct-composition');

// Suppress the punycode deprecation warning globally
process.noDeprecation = true;
const originalEmitWarning = process.emitWarning;
process.emitWarning = function (warning, ...args) {
  if (typeof warning === 'string' && warning.includes('punycode')) return;
  return originalEmitWarning.call(process, warning, ...args);
};

let mainWindow;

// ─── Single instance guard ────────────────────────────────────────────────────
// Prevents the app from hanging invisibly in Task Manager after install/update.
// Use process.exit(0) instead of app.quit() so the process terminates
// immediately even if app.quit() hangs before app.whenReady().
const gotSingleInstanceLock = app.requestSingleInstanceLock();
if (!gotSingleInstanceLock) {
  process.exit(0);
} else {
  app.on('second-instance', () => {
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.focus();
    }
  });
}
// ─────────────────────────────────────────────────────────────────────────────

function getUserDataPath() {
  return app.getPath('userData');
}

function getAppRootPath() {
  if (app.isPackaged) {
    return path.resolve(process.resourcesPath, '..');
  }
  return path.resolve(__dirname, '..');
}

function getDefaultGlossaryPath() {
  if (app.isPackaged) {
    return path.join(process.resourcesPath, 'glossary', 'glossary_default.json');
  }
  return path.join(__dirname, '..', 'Glossary', 'glossary_default.json');
}

function createWindow() {
  const { width: screenW, height: screenH } = screen.getPrimaryDisplay().workAreaSize;

  const DEFAULT_W = 1300;
  const DEFAULT_H = 960;
  const MIN_W = 900;
  const MIN_H = 620;

  const winWidth  = Math.max(MIN_W, Math.min(DEFAULT_W, screenW));
  const winHeight = Math.max(MIN_H, Math.min(DEFAULT_H, screenH - 40));

  mainWindow = new BrowserWindow({
    width: winWidth,
    height: winHeight,
    minWidth: MIN_W,
    minHeight: MIN_H,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
    },
    frame: false,
    backgroundColor: '#0f0f13',
  });

  mainWindow.on('close', (e) => {
    if (app.isQuitting) return;
    e.preventDefault();
    mainWindow.webContents.send('os-window-close');
  });

  if (process.env.VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(process.env.VITE_DEV_SERVER_URL);
    // mainWindow.webContents.openDevTools({ mode: 'detach' });
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
  }
}

app.whenReady().then(() => {
  // Each manager is isolated so a single failure never prevents the window
  // from appearing (the most common cause of "app hangs with no window").
  try { firstRunManager.initialize({ userDataPath: getUserDataPath(), defaultGlossaryPath: getDefaultGlossaryPath() }); } catch (e) { console.error('[firstRunManager]', e); }
  try { smartManager.initializeSettingsStore(getUserDataPath()); } catch (e) { console.error('[smartManager]', e); }
  try { aiManager.initializeSettings(getUserDataPath()); } catch (e) { console.error('[aiManager]', e); }
  try { dictionaryManager.initialize(getAppRootPath(), getDefaultGlossaryPath()); } catch (e) { console.error('[dictionaryManager]', e); }
  try { authManager.initialize(getUserDataPath(), app.getAppPath()); } catch (e) { console.error('[authManager]', e); }
  try { bg3Manager.initialize(getUserDataPath(), app.getAppPath()); } catch (e) { console.error('[bg3Manager]', e); }
  try { projectManager.initialize(getUserDataPath()); } catch (e) { console.error('[projectManager]', e); }

  createWindow();

  // If the renderer process crashes, reload it instead of leaving a dead window.
  app.on('render-process-gone', (_event, _webContents, details) => {
    console.error('[renderer] process gone:', details.reason, details.exitCode);
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.reload();
    }
  });

  // Wire updater to the main window so it can broadcast events to renderer.
  updateManager.initialize(mainWindow);

  registerAllHandlers({
    app,
    mainWindow,
    getUserDataPath,
    services: { bg3Manager, smartManager, projectManager, aiManager, updateManager },
  });

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });

  // Auto-start Ollama server if installed but not running
  ollamaManager.ensureRunning().catch((err) => {
    console.warn('Ollama auto-start skipped:', err?.message || err);
  });

  // Silent update check ~3s after launch (packaged builds only — dev builds are a no-op).
  if (app.isPackaged) {
    setTimeout(() => {
      updateManager.checkForUpdates({ silent: true }).catch(() => {});
    }, 3000);
  }
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

