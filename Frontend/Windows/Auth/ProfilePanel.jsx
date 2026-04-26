import React, { useState, useCallback } from 'react';
import { useAuth, TIER } from '../../Core/logic/AuthCore';
import { useLocale } from '../../Locales';
import { notify } from '../../Shared/notificationCore_utils/notifications';
import TierBadge from '../../Shared/TierBadge';
import {
  User, LogOut, Crown, Clock, Gift, Shield, Sparkles,
  ExternalLink, Check, Bot, Hash,
} from 'lucide-react';
import { MEDIA_LINKS } from '../../Config/mediaConfig';

// ─── Profile Panel ──────────────────────────────────────────────────────────────

export default function ProfilePanel({ isOpen }) {
  const t = useLocale();
  const auth = useAuth();
  const {
    isLoggedIn, user, tier, trialDaysLeft, canUseAI, isInGuild,
    login, logout, startTrial,
    localName, setLocalName,
  } = auth;

  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [isStartingTrial, setIsStartingTrial] = useState(false);
  const [editingName, setEditingName] = useState(false);
  const [nameValue, setNameValue] = useState(localName);

  // Sync name when panel opens
  React.useEffect(() => {
    if (isOpen) {
      setNameValue(localName);
      setEditingName(false);
    }
  }, [isOpen, localName]);

  const handleSaveName = useCallback(() => {
    setLocalName(nameValue);
    setEditingName(false);
    if (nameValue.trim()) {
      notify.success(t.auth.saveNameSuccess, t.auth.saveNameSuccessDesc, 2000);
    }
  }, [nameValue, setLocalName, t.auth.saveNameSuccess, t.auth.saveNameSuccessDesc]);

  const handleLogin = async () => {
    setIsLoggingIn(true);
    const res = await login();
    setIsLoggingIn(false);
    if (!res?.success && res?.error) {
      notify.error(t.auth.loginError, res.error, 5000);
    }
  };

  const handleLogout = async () => {
    setIsLoggingOut(true);
    await logout();
    setIsLoggingOut(false);
  };

  const handleStartTrial = async () => {
    setIsStartingTrial(true);
    const res = await startTrial();
    setIsStartingTrial(false);
    if (res?.success) {
      notify.success(t.auth.trialActivated, t.auth.trialActivatedDesc, 3000);
    } else {
      notify.error(t.auth.trialError, res?.error || t.auth.trialErrorDesc, 5000);
    }
  };

  const canStartTrial = isLoggedIn && tier === TIER.FREE && trialDaysLeft > 0;

  return (
    <div className="flex flex-col h-full min-h-0 overflow-hidden">
      {/* Header — Avatar + Name + Tier — glassy */}
      <div className="shrink-0 px-5 pt-5 pb-4 border-b border-white/[0.06] bg-white/[0.02] backdrop-blur-2xl relative overflow-hidden">
        {/* Glass shimmer top edge */}
        <div className="absolute inset-x-0 top-0 h-[1px] bg-gradient-to-r from-transparent via-white/[0.12] to-transparent" />
        {/* Soft radial glow */}
        <div className="absolute inset-0 pointer-events-none" style={{ background: 'radial-gradient(ellipse 80% 60% at 30% 20%, rgba(139,92,246,0.06) 0%, transparent 70%)' }} />
        <div className="flex items-center gap-3.5 mb-3">
          {isLoggedIn && user?.avatar ? (
            <img
              src={user.avatar}
              alt=""
              className="w-12 h-12 rounded-xl ring-2 ring-white/[0.08] shrink-0"
            />
          ) : (
            <div className="w-12 h-12 rounded-xl bg-surface-3 border border-white/[0.1] flex items-center justify-center shrink-0">
              <User className="w-5 h-5 text-zinc-500" />
            </div>
          )}
          <div className="flex-1 min-w-0">
            <p className="text-[14px] font-semibold text-zinc-100 truncate">
              {isLoggedIn ? (user?.displayName || user?.username) : t.tiers.guest}
            </p>
            {isLoggedIn && user?.username && (
              <div className="flex items-center gap-1.5 mt-0.5">
                <User className="w-3 h-3 text-indigo-400/70 shrink-0" />
                <span className="text-[12px] text-indigo-300 font-medium truncate">@{user.username}</span>
              </div>
            )}
            {isLoggedIn && user?.id && (
              <div className="flex items-center gap-1.5 mt-0.5">
                <Hash className="w-3 h-3 text-zinc-600 shrink-0" />
                <span className="text-[11px] text-zinc-500 font-mono truncate">{user.id}</span>
              </div>
            )}
          </div>
        </div>
        <TierBadge tier={tier} />
      </div>

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden py-5 px-5 space-y-4">
        {/* Local name */}
        <div>
          <label className="text-[11px] font-bold tracking-widest text-zinc-500 uppercase mb-2 block px-1">
            {t.auth.localName}
          </label>
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={nameValue}
              onChange={(e) => { setNameValue(e.target.value); setEditingName(true); }}
              onKeyDown={(e) => { if (e.key === 'Enter') handleSaveName(); }}
              placeholder={t.auth.localNamePlaceholder}
              maxLength={100}
              className="flex-1 bg-white/[0.04] border border-white/[0.08] rounded-xl px-3 py-2 text-[13px] text-zinc-200 placeholder-zinc-600 outline-none transition-[border-color,box-shadow] duration-200 focus:border-white/[0.25] focus:ring-2 focus:ring-white/[0.06]"
            />
            {editingName && (
              <button
                onClick={handleSaveName}
                className="w-8 h-8 rounded-lg bg-emerald-500/[0.1] border border-emerald-500/20 flex items-center justify-center text-emerald-400 hover:bg-emerald-500/[0.2] transition-all duration-200 shrink-0"
              >
                <Check className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
          <p className="text-[11px] text-zinc-600 leading-relaxed px-1 mt-1.5">{t.auth.localNameDesc}</p>
        </div>

        {/* Status info */}
        {isLoggedIn && (
          <div className="space-y-2 px-1">
            {user?.username && (
              <div className="flex items-center gap-2.5 text-[13px]">
                <User className="w-3.5 h-3.5 shrink-0 text-indigo-400/70" />
                <span className="text-indigo-300 font-medium">@{user.username}</span>
              </div>
            )}
            {tier === TIER.TRIAL && (
              <div className="flex items-center gap-2.5 text-amber-300/80 text-[13px]">
                <Clock className="w-3.5 h-3.5 shrink-0" />
                <span>{t.auth.daysLeft(trialDaysLeft)}</span>
              </div>
            )}
            {tier === TIER.FREE && trialDaysLeft === 0 && (
              <div className="flex items-center gap-2.5 text-zinc-500 text-[13px]">
                <Clock className="w-3.5 h-3.5 shrink-0" />
                <span>{t.auth.trialEnded}</span>
              </div>
            )}
            {tier === TIER.PREMIUM && (
              <div className="flex items-center gap-2.5 text-violet-300/80 text-[13px]">
                <Sparkles className="w-3.5 h-3.5 shrink-0" />
                <span>{t.auth.premiumActive}</span>
              </div>
            )}
            <div className={`flex items-center gap-2.5 text-[13px] ${canUseAI ? 'text-emerald-300' : 'text-red-400'}`}>
              <Bot className={`w-3.5 h-3.5 shrink-0 ${canUseAI ? 'text-emerald-400' : 'text-red-400/80'}`} />
              <span className="font-medium">{canUseAI ? t.auth.aiFeaturesOn : t.auth.aiFeaturesOff}</span>
            </div>
            {!isInGuild && (
              <div className="flex items-center gap-2.5 text-zinc-500 text-[13px]">
                <Shield className="w-3.5 h-3.5 shrink-0" />
                <span>Не на сервере Discord</span>
              </div>
            )}
          </div>
        )}

        {/* Actions */}
        <div className="space-y-2 pt-1">
          {!isLoggedIn && (
            <>
              <p className="text-[13px] text-zinc-400 leading-relaxed px-1">
                Войдите через Discord, чтобы получить доступ к Smart-переводу, словарю и другим расширенным функциям.
              </p>
              <button
                onClick={handleLogin}
                disabled={isLoggingIn}
                className="group relative w-full flex items-center justify-center gap-2.5 h-11 rounded-xl border border-indigo-500/30 bg-indigo-500/[0.08] text-indigo-200 font-semibold text-[13px] hover:bg-indigo-500/[0.14] hover:border-indigo-400/40 hover:shadow-[0_0_24px_rgba(99,102,241,0.15)] active:scale-[0.98] transition-all duration-200 disabled:opacity-40 overflow-hidden"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.095 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.095 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z" />
                </svg>
                <span>{isLoggingIn ? t.auth.connecting : t.auth.loginDiscord}</span>
              </button>
            </>
          )}

          {canStartTrial && (
            <button
              onClick={handleStartTrial}
              disabled={isStartingTrial}
              className="w-full flex items-center justify-center gap-2.5 h-10 rounded-xl border border-amber-500/20 bg-amber-500/[0.06] text-amber-300 text-[13px] font-medium hover:bg-amber-500/[0.1] hover:border-amber-500/30 transition-all duration-200 disabled:opacity-40"
            >
              <Gift className="w-3.5 h-3.5" />
              {isStartingTrial ? t.auth.activating : t.auth.trialActivateBtn(trialDaysLeft)}
            </button>
          )}

          {isLoggedIn && !canUseAI && trialDaysLeft === 0 && (
            <button
              onClick={() => window.electronAPI.openExternal(MEDIA_LINKS.boosty)}
              className="w-full flex items-center justify-center gap-2.5 h-10 rounded-xl border border-violet-500/20 bg-violet-500/[0.06] text-violet-300 text-[13px] font-medium hover:bg-violet-500/[0.1] hover:border-violet-500/30 transition-all duration-200"
            >
              <Crown className="w-3.5 h-3.5" />
              <span>{t.auth.getPremium}</span>
              <ExternalLink className="w-3 h-3 text-violet-400/50" />
            </button>
          )}

          {isLoggedIn && (
            <button
              onClick={handleLogout}
              disabled={isLoggingOut}
              className="w-full flex items-center justify-center gap-2.5 h-10 rounded-xl border border-white/[0.06] text-zinc-400 text-[13px] font-medium hover:text-red-400 hover:border-red-500/20 hover:bg-red-500/[0.04] transition-all duration-200 disabled:opacity-40"
            >
              <LogOut className="w-3.5 h-3.5" />
              {isLoggingOut ? t.auth.loggingOut : t.auth.logout}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
