const { app, BrowserWindow } = require('electron');
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
  mainWindow = new BrowserWindow({
    width: 1300,
    height: 960,
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
  // First-run: create %APPDATA%\BG3 ULTIMA with defaults (onboarding + glossary).
  firstRunManager.initialize({
    userDataPath: getUserDataPath(),
    defaultGlossaryPath: getDefaultGlossaryPath(),
  });

  smartManager.initializeSettingsStore(getUserDataPath());
  aiManager.initializeSettings(getUserDataPath());
  dictionaryManager.initialize(getAppRootPath(), getDefaultGlossaryPath());
  authManager.initialize(getUserDataPath(), app.getAppPath());
  bg3Manager.initialize(getUserDataPath(), app.getAppPath());
  projectManager.initialize(getUserDataPath());

  createWindow();

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

