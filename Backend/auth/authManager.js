const discord = require('./discordOAuth');
const supabase = require('./supabaseClient');
const authStore = require('./authStore');
const { TIER, TRIAL_DURATION_MS, TRIAL_DURATION_DAYS } = require('./constants');

// ─── Embedded Auth Configuration ───────────────────────────────────────────────
const AUTH_CONFIG = {
  discord: {
    clientId: "1493595583095505069",
    guildId: "1493596798252486678",
    proRoleId: "1493597140071481496",
    devRoleId: "1494627724218728529"
  },
  supabase: {
    url: "https://ersjewekswnxxxgdzeff.supabase.co",
    anonKey: "sb_publishable_wm1Pr6qR6EKJjwsyPiuqQw_rkiMgzvN"
  }
};

// ─── AuthManager ────────────────────────────────────────────────────────────────

class AuthManager {
  constructor() {
    this._config = AUTH_CONFIG;
    this._state = this._guestState();
  }

  // ── Initialization ──────────────────────────────────────────────────────────

  initialize(userDataPath, _appPath) {
    authStore.init(userDataPath);

    // Configure Supabase (if credentials provided)
    if (this._config?.supabase?.url && this._config?.supabase?.anonKey) {
      supabase.configure(this._config.supabase.url, this._config.supabase.anonKey);
    }

    // Restore cached session
    const cached = authStore.load();
    if (cached && authStore.isCacheValid(cached)) {
      this._state = cached.authState || this._guestState();
      // Restore roles from cache if available
      if (cached.roles && !this._state.roles) {
        this._state.roles = cached.roles;
      }
      console.log(`AuthManager: restored session — ${this._state.user?.username || 'guest'} [${this._state.tier}]`);
    } else if (cached?.tokens?.refresh_token) {
      // Cache expired but we have a refresh token — schedule silent refresh
      this._state = cached.authState || this._guestState();
      // Restore roles from cache if available
      if (cached.roles && !this._state.roles) {
        this._state.roles = cached.roles;
      }
      // Only do silent refresh if we don't have cached roles
      if (!cached.roles || cached.roles.length === 0) {
        this._silentRefresh();
      }
    }
  }

  get isConfigured() {
    return Boolean(
      this._config?.discord?.clientId &&
      this._config?.discord?.guildId,
    );
  }

  get _devRoleId() {
    return this._config?.discord?.devRoleId || null;
  }

  // ── Public API ──────────────────────────────────────────────────────────────

  getState() {
    return { ...this._state, isConfigured: this.isConfigured };
  }

  async login() {
    if (!this.isConfigured) {
      throw new Error('Авторизация не настроена. Проверьте auth.config.json');
    }

    const { clientId, guildId, proRoleId } = this._config.discord;

    // 1. Open Discord OAuth window (PKCE) → get authorization code + verifier
    const { code, codeVerifier } = await discord.openOAuthWindow(clientId);

    // 2. Exchange code for tokens using PKCE verifier (no clientSecret)
    const tokenData = await discord.exchangeCode(code, clientId, codeVerifier);
    const { access_token, refresh_token, expires_in } = tokenData;

    // 3. Fetch Discord user profile
    const user = await discord.fetchUser(access_token);

    // 4. Fetch guild membership + roles
    const member = await discord.fetchGuildMember(access_token, guildId);
    const roles = member?.roles || [];

    // 5. Upsert user in Supabase (creates row on first login)
    let trialStartedAt = null;
    let serverLocalName = null;
    if (supabase.isConfigured) {
      try {
        const supaUser = await supabase.upsertUser(user.id);
        trialStartedAt = supaUser?.trial_started_at || null;
        serverLocalName = supaUser?.local_name || null;
        console.log(`AuthManager: Supabase upsert OK — trial_started_at=${trialStartedAt}`);
      } catch (err) {
        console.warn('AuthManager: Supabase upsert failed:', err.message);
      }
    } else {
      console.warn('AuthManager: Supabase not configured — skipping upsert');
    }

    // 6. Determine subscription tier
    const tier = this._determineTier(roles, proRoleId, trialStartedAt, this._devRoleId);
    const trialDaysLeft = this._calcTrialDaysLeft(trialStartedAt);

    // 7. Build state
    this._state = {
      isLoggedIn: true,
      tier,
      user: this._buildUserObject(user),
      trialDaysLeft,
      isInGuild: !!member,
      serverLocalName, // renderer uses this to restore local name from Supabase
      roles, // Cache Discord roles for refresh
    };

    // 8. Persist to disk
    this._persistCache(access_token, refresh_token, expires_in);

    console.log(`AuthManager: logged in — ${user.username} [${tier}]`);
    return this._state;
  }

  async logout() {
    authStore.clear();
    this._state = this._guestState();
    return this._state;
  }

  async saveLocalName(name) {
    if (!this._state.isLoggedIn || !this._state.user?.id) return;
    if (!supabase.isConfigured) return;
    await supabase.updateLocalName(this._state.user.id, name || '');
  }

  async startTrial() {
    if (!this._state.isLoggedIn || !this._state.user?.id) {
      throw new Error('Необходимо войти в аккаунт');
    }
    if (this._state.tier === TIER.PREMIUM) {
      throw new Error('У вас уже активна Премиум-подписка');
    }
    if (!supabase.isConfigured) {
      throw new Error('Supabase не настроен');
    }

    const result = await supabase.startTrial(this._state.user.id);
    if (!result) throw new Error('Не удалось активировать пробный период');

    const trialStartedAt = result.trial_started_at;
    const trialDaysLeft = this._calcTrialDaysLeft(trialStartedAt);

    this._state.tier = trialDaysLeft > 0 ? TIER.TRIAL : TIER.FREE;
    this._state.trialDaysLeft = trialDaysLeft;

    // Update cache without re-fetching tokens
    const cached = authStore.load();
    if (cached) {
      cached.authState = this._state;
      cached.cachedAt = Date.now();
      authStore.save(cached);
    }

    console.log(`AuthManager: trial started — ${trialDaysLeft} days left`);
    return this._state;
  }

  async refreshSession() {
    if (!this.isConfigured) return this._state;

    const cached = authStore.load();
    if (!cached?.tokens?.refresh_token) return this._state;

    const attemptedRefreshToken = cached.tokens.refresh_token;
    const { clientId, guildId, proRoleId } = this._config.discord;

    try {
      const tokenData = await discord.refreshAccessToken(
        attemptedRefreshToken,
        clientId,
      );
      if (!tokenData) {
        // Check if a concurrent login replaced the tokens while we waited
        const fresh = authStore.load();
        if (fresh?.tokens?.refresh_token && fresh.tokens.refresh_token !== attemptedRefreshToken) {
          console.log('AuthManager: token refresh skipped — concurrent login detected');
          return this._state;
        }

        // Discord PKCE refresh requires no client_secret — rotation may not be
        // supported. If the access token is still valid, re-verify using it.
        if (cached.tokens.access_token && cached.tokens.expires_at > Date.now()) {
          return this._reverifyWithToken(
            cached.tokens.access_token,
            cached.tokens.refresh_token,
            // expires_in from now (remaining TTL)
            Math.floor((cached.tokens.expires_at - Date.now()) / 1000),
            guildId,
            proRoleId,
          );
        }

        console.warn('AuthManager: token refresh failed — session expired');
        return this.logout();
      }

      const { access_token, refresh_token, expires_in } = tokenData;
      return this._reverifyWithToken(access_token, refresh_token, expires_in, guildId, proRoleId);
    } catch (err) {
      console.warn('AuthManager: refresh failed:', err.message);
      return this._state;
    }
  }

  async _reverifyWithToken(accessToken, refreshToken, expiresIn, guildId, proRoleId) {
    // Re-fetch user using the access token
    const user = await discord.fetchUser(accessToken);

    // Always fetch current roles from Discord to detect role changes
    const member = await discord.fetchGuildMember(accessToken, guildId);
    const roles = member?.roles || [];

    // Re-check trial in Supabase
    let trialStartedAt = null;
    let serverLocalName = null;
    if (supabase.isConfigured) {
      const supaUser = await supabase.getUser(user.id);
      if (!supaUser) {
        console.warn('AuthManager: user not found in Supabase — forcing logout');
        return this.logout();
      }
      trialStartedAt = supaUser?.trial_started_at || null;
      serverLocalName = supaUser?.local_name || null;
    }

    const tier = this._determineTier(roles, proRoleId, trialStartedAt, this._devRoleId);
    const trialDaysLeft = this._calcTrialDaysLeft(trialStartedAt);

    this._state = {
      isLoggedIn: true,
      tier,
      user: this._buildUserObject(user),
      trialDaysLeft,
      isInGuild: !!member,
      serverLocalName,
      roles, // Update cached roles
    };

    this._persistCache(accessToken, refreshToken, expiresIn);
    return this._state;
  }

  // ── Internals ───────────────────────────────────────────────────────────────

  _guestState() {
    return {
      isLoggedIn: false,
      tier: TIER.GUEST,
      user: null,
      trialDaysLeft: 0,
      isInGuild: false,
    };
  }

  _buildUserObject(discordUser) {
    return {
      id: discordUser.id,
      username: discordUser.username,
      displayName: discordUser.global_name || discordUser.username,
      avatar: discordUser.avatar
        ? `https://cdn.discordapp.com/avatars/${discordUser.id}/${discordUser.avatar}.png?size=64`
        : null,
    };
  }

  _determineTier(roles, proRoleId, trialStartedAt, devRoleId) {
    // DEVELOPER — highest priority, full access
    if (devRoleId && roles.includes(devRoleId)) return TIER.DEVELOPER;

    // PREMIUM — has the paid subscriber role on Discord (assigned by Boosty bot)
    if (proRoleId && roles.includes(proRoleId)) return TIER.PREMIUM;

    // TRIAL — trial started and not yet expired
    if (trialStartedAt) {
      const elapsed = Date.now() - new Date(trialStartedAt).getTime();
      if (elapsed < TRIAL_DURATION_MS) return TIER.TRIAL;
    }

    // FREE — authorized but no subscription / trial expired
    return TIER.FREE;
  }

  _calcTrialDaysLeft(trialStartedAt) {
    if (!trialStartedAt) return TRIAL_DURATION_DAYS; // full trial available
    const remaining = TRIAL_DURATION_MS - (Date.now() - new Date(trialStartedAt).getTime());
    return Math.max(0, Math.ceil(remaining / (24 * 60 * 60 * 1000)));
  }

  _persistCache(accessToken, refreshToken, expiresIn) {
    authStore.save({
      authState: this._state,
      tokens: {
        access_token: accessToken,
        refresh_token: refreshToken,
        expires_at: Date.now() + expiresIn * 1000,
      },
      cachedAt: Date.now(),
      roles: this._state.roles || [], // Cache Discord roles
    });
  }

  _silentRefresh() {
    // Non-blocking refresh in background
    this.refreshSession().catch((err) => {
      console.warn('AuthManager: silent refresh failed:', err.message);
    });
  }
}

module.exports = new AuthManager();
