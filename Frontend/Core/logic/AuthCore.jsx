/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useContext, useState, useCallback, useEffect, useMemo } from 'react';

// ─── Tier constants (mirror electron/auth/constants.js) ─────────────────────────

export const TIER = {
  GUEST: 'guest',
  TRIAL: 'trial',
  FREE: 'free',
  PREMIUM: 'premium',
  DEVELOPER: 'developer',
};

export const TIER_LABELS = {
  [TIER.GUEST]: 'Гость',
  [TIER.TRIAL]: 'Пробный',
  [TIER.FREE]: 'Бесплатный',
  [TIER.PREMIUM]: 'Премиум',
  [TIER.DEVELOPER]: 'Разработчик',
};

export const TIER_COLORS = {
  [TIER.GUEST]: { text: 'text-zinc-400', bg: 'bg-zinc-500/10', border: 'border-zinc-500/20', dot: 'bg-zinc-400' },
  [TIER.TRIAL]: { text: 'text-amber-300', bg: 'bg-amber-500/10', border: 'border-amber-500/20', dot: 'bg-amber-400' },
  [TIER.FREE]: { text: 'text-sky-300', bg: 'bg-sky-500/10', border: 'border-sky-500/20', dot: 'bg-sky-400' },
  [TIER.PREMIUM]: { text: 'text-violet-300', bg: 'bg-violet-500/10', border: 'border-violet-500/20', dot: 'bg-violet-400' },
  [TIER.DEVELOPER]: { text: 'text-emerald-300', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20', dot: 'bg-emerald-400' },
};

// ─── Context ────────────────────────────────────────────────────────────────────

const AuthContext = createContext(null);

const INITIAL_STATE = {
  isLoggedIn: false,
  tier: TIER.GUEST,
  user: null,
  trialDaysLeft: 0,
  isInGuild: false,
  isLoading: true,
  isConfigured: false,
};

// ─── Provider ───────────────────────────────────────────────────────────────────

export function AuthProvider({ children }) {
  const [state, setState] = useState(INITIAL_STATE);
  const [isOffline, setIsOffline] = useState(() => !navigator.onLine);

  // ── Online / offline detection ──────────────────────────────────────────────
  useEffect(() => {
    const goOnline = () => setIsOffline(false);
    const goOffline = () => setIsOffline(true);
    window.addEventListener('online', goOnline);
    window.addEventListener('offline', goOffline);
    return () => {
      window.removeEventListener('online', goOnline);
      window.removeEventListener('offline', goOffline);
    };
  }, []);

  // Load initial auth state from Electron
  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!window.electronAPI?.authGetState) {
        if (!cancelled) setState((prev) => ({ ...prev, isLoading: false }));
        return;
      }
      try {
        const res = await window.electronAPI.authGetState();
        if (cancelled) return;
        if (res?.success) {
          setState({ ...res.state, isLoading: false });
        } else {
          setState((prev) => ({ ...prev, isLoading: false }));
        }
      } catch {
        if (!cancelled) setState((prev) => ({ ...prev, isLoading: false }));
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const login = useCallback(async () => {
    if (!window.electronAPI?.authLogin) return { success: false, error: 'API недоступен' };
    try {
      const res = await window.electronAPI.authLogin();
      if (res?.success) {
        setState((prev) => ({ ...prev, ...res.state }));
      }
      return res;
    } catch (err) {
      return { success: false, error: err?.message || 'Ошибка входа' };
    }
  }, []);

  const logout = useCallback(async () => {
    if (!window.electronAPI?.authLogout) return { success: false };
    try {
      const res = await window.electronAPI.authLogout();
      if (res?.success) {
        setState((prev) => ({ ...prev, ...res.state }));
      }
      return res;
    } catch {
      return { success: false };
    }
  }, []);

  const startTrial = useCallback(async () => {
    if (!window.electronAPI?.authStartTrial) return { success: false, error: 'API недоступен' };
    try {
      const res = await window.electronAPI.authStartTrial();
      if (res?.success) {
        setState((prev) => ({ ...prev, ...res.state }));
      }
      return res;
    } catch (err) {
      return { success: false, error: err?.message || 'Ошибка активации' };
    }
  }, []);

  const refresh = useCallback(async () => {
    if (!window.electronAPI?.authRefresh) return;
    if (!navigator.onLine) return; // skip refresh when offline
    try {
      const res = await window.electronAPI.authRefresh();
      if (res?.success) {
        setState((prev) => ({ ...prev, ...res.state }));
      }
    } catch { /* silent */ }
  }, []);

  // ── Effective tier: if offline, restrict to guest permissions ─────────────
  const effectiveTier = isOffline ? TIER.GUEST : state.tier;
  const canUseAI = effectiveTier === TIER.PREMIUM || effectiveTier === TIER.TRIAL || effectiveTier === TIER.DEVELOPER;
  const canUseAutoTranslate = effectiveTier !== TIER.GUEST;
  const canUseDictionary = effectiveTier !== TIER.GUEST;
  const isDeveloper = effectiveTier === TIER.DEVELOPER;

  // ── Local author name (persisted in localStorage, synced to Supabase when logged in) ──
  const [localName, setLocalNameRaw] = useState(() => {
    try { return localStorage.getItem('bg3-ultima-local-name') || ''; } catch { return ''; }
  });

  const setLocalName = useCallback((name) => {
    const v = (name || '').slice(0, 100);
    setLocalNameRaw(v);
    try {
      if (v) localStorage.setItem('bg3-ultima-local-name', v);
      else localStorage.removeItem('bg3-ultima-local-name');
    } catch { /* ignore */ }
    // Push to Supabase so the name survives reinstalls/new devices
    if (window.electronAPI?.authSaveLocalName) {
      window.electronAPI.authSaveLocalName(v).catch(() => {});
    }
  }, []);

  // ── Sync local name from Supabase when logging in ───────────────────────────
  // serverLocalName is returned by login/refresh — prefer it over localStorage
  // so that names set on other devices are restored automatically.
  useEffect(() => {
    const serverName = state.serverLocalName;
    if (!state.isLoggedIn || !serverName) return;
    // Only restore if localStorage is empty or server has a newer/different name
    const stored = (() => { try { return localStorage.getItem('bg3-ultima-local-name') || ''; } catch { return ''; } })();
    if (serverName !== stored) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setLocalNameRaw(serverName);
      try { localStorage.setItem('bg3-ultima-local-name', serverName); } catch { /* ignore */ }
    }
  }, [state.isLoggedIn, state.serverLocalName]);

  // ── Startup refresh + periodic refresh (every 1 min) ─────────────────────
  useEffect(() => {
    if (!state.isLoggedIn) return;
    // Only periodic refresh, not immediate (login already fetched roles)
    const id = setInterval(refresh, 60 * 1000);
    return () => clearInterval(id);
  }, [state.isLoggedIn, refresh]);

  // ── When coming back online, refresh immediately ────────────────────────
  useEffect(() => {
    if (!isOffline && state.isLoggedIn) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      refresh();
    }
  }, [isOffline]); // eslint-disable-line react-hooks/exhaustive-deps

  const value = useMemo(
    () => ({
      ...state, login, logout, startTrial, refresh,
      canUseAI, canUseAutoTranslate, canUseDictionary, isDeveloper,
      localName, setLocalName, isOffline,
    }),
    [state, login, logout, startTrial, refresh, canUseAI, canUseAutoTranslate, canUseDictionary, isDeveloper, localName, setLocalName, isOffline],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// ─── Hook ───────────────────────────────────────────────────────────────────────

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within <AuthProvider>');
  return ctx;
}
