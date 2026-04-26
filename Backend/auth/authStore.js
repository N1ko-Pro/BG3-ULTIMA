const fs = require('fs');
const path = require('path');
const { AUTH_CACHE_FILE, CACHE_TTL_MS } = require('./constants');

let _storePath = '';

function init(userDataPath) {
  _storePath = path.join(userDataPath, AUTH_CACHE_FILE);
}

function load() {
  try {
    const raw = fs.readFileSync(_storePath, 'utf8');
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function save(data) {
  try {
    fs.writeFileSync(_storePath, JSON.stringify(data, null, 2), 'utf8');
  } catch (err) {
    console.error('AuthStore: failed to save:', err.message);
  }
}

function clear() {
  try {
    if (fs.existsSync(_storePath)) fs.unlinkSync(_storePath);
  } catch (err) {
    console.error('AuthStore: failed to clear:', err.message);
  }
}

function isCacheValid(cached) {
  if (!cached || !cached.cachedAt) return false;
  return Date.now() - cached.cachedAt < CACHE_TTL_MS;
}

module.exports = { init, load, save, clear, isCacheValid };
