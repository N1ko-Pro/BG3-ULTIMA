const AUTH_CACHE_FILE = 'auth-cache.json';
const CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24 часа
const TRIAL_DURATION_DAYS = 5;
const TRIAL_DURATION_MS = TRIAL_DURATION_DAYS * 24 * 60 * 60 * 1000;

const TIER = {
  GUEST: 'guest',
  TRIAL: 'trial',
  FREE: 'free',
  PREMIUM: 'premium',
  DEVELOPER: 'developer',
};

const DISCORD_API_BASE = 'https://discord.com/api/v10';
const DISCORD_AUTHORIZE_URL = 'https://discord.com/oauth2/authorize';
const DISCORD_TOKEN_URL = 'https://discord.com/api/v10/oauth2/token';
const DISCORD_REDIRECT_URI = 'http://localhost/auth/callback';
const DISCORD_SCOPES = ['identify', 'guilds.members.read'];

module.exports = {
  AUTH_CACHE_FILE,
  CACHE_TTL_MS,
  TRIAL_DURATION_DAYS,
  TRIAL_DURATION_MS,
  TIER,
  DISCORD_API_BASE,
  DISCORD_AUTHORIZE_URL,
  DISCORD_TOKEN_URL,
  DISCORD_REDIRECT_URI,
  DISCORD_SCOPES,
};
