import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useAuth, TIER, TIER_COLORS } from '../../Core/logic/AuthCore';
import { notify } from '../../Shared/notificationCore_utils/notifications';
import TierBadge from '../../Shared/TierBadge';
import { MEDIA_LINKS } from '../../Config/mediaConfig';
import { User, LogIn, LogOut, Crown, Clock, Gift, ChevronDown, Shield, Sparkles, Bot, ExternalLink, Hash } from 'lucide-react';
import { useLocale } from '../../Locales';

// ─── Dropdown panel ─────────────────────────────────────────────────────────────

function ProfileDropdown({ onClose }) {
  const auth = useAuth();
  const { user, tier, trialDaysLeft, isInGuild, logout, startTrial, canUseAI } = auth;
  const t = useLocale();

  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [isStartingTrial, setIsStartingTrial] = useState(false);

  const handleLogout = async () => {
    setIsLoggingOut(true);
    await logout();
    setIsLoggingOut(false);
    onClose();
  };

  const handleStartTrial = async () => {
    setIsStartingTrial(true);
    const res = await startTrial();
    setIsStartingTrial(false);
    if (res?.success) {
      notify.success(t.auth.trialActivated, t.auth.trialActivatedNotify, 4000);
      onClose();
    } else {
      notify.error(t.auth.trialError, res?.error || t.auth.trialErrorActivate, 6000);
    }
  };

  const canStartTrial = tier === TIER.FREE && trialDaysLeft > 0;

  return (
    <div className="w-64 rounded-xl border border-white/[0.1] bg-surface-2/98 backdrop-blur-2xl shadow-[0_12px_48px_rgba(0,0,0,0.6)] overflow-hidden animate-[fadeIn_150ms_ease-out]">
      {/* Header — user info */}
      <div className="px-4 pt-4 pb-3 border-b border-white/[0.06]">
        <div className="flex items-center gap-3">
          {user?.avatar ? (
            <img
              src={user.avatar}
              alt=""
              className="w-9 h-9 rounded-full ring-2 ring-white/[0.08] shrink-0"
            />
          ) : (
            <div className="w-9 h-9 rounded-full bg-white/[0.06] border border-white/[0.1] flex items-center justify-center shrink-0">
              <User className="w-4 h-4 text-zinc-500" />
            </div>
          )}
          <div className="min-w-0">
            <p className="text-[13px] font-semibold text-zinc-100 truncate">{user?.displayName || user?.username}</p>
          </div>
        </div>
        <div className="mt-2.5">
          <TierBadge tier={tier} size="sm" />
        </div>
      </div>

      {/* Status info */}
      <div className="px-4 py-3 space-y-2 text-[13px]">
        {user?.username && (
          <div className="flex items-center gap-2.5">
            <User className="w-3.5 h-3.5 shrink-0 text-indigo-400/70" />
            <span className="text-indigo-300 font-medium">@{user.username}</span>
          </div>
        )}
        {user?.id && (
          <div className="flex items-center gap-2.5">
            <Hash className="w-3.5 h-3.5 shrink-0 text-zinc-600" />
            <span className="text-zinc-500 font-mono text-[12px]">{user.id}</span>
          </div>
        )}
        {tier === TIER.TRIAL && (
          <div className="flex items-center gap-2.5 text-amber-300/80">
            <Clock className="w-3.5 h-3.5 shrink-0" />
            <span>{t.auth.daysLeft(trialDaysLeft)}</span>
          </div>
        )}

        {tier === TIER.FREE && trialDaysLeft === 0 && (
          <div className="flex items-center gap-2.5 text-zinc-500">
            <Clock className="w-3.5 h-3.5 shrink-0" />
            <span>{t.auth.trialExpired}</span>
          </div>
        )}

        {tier === TIER.PREMIUM && (
          <div className="flex items-center gap-2.5 text-violet-300/80">
            <Sparkles className="w-3.5 h-3.5 shrink-0" />
            <span>{t.auth.premiumActive}</span>
          </div>
        )}

        {!isInGuild && (
          <div className="flex items-center gap-2.5 text-zinc-500">
            <Shield className="w-3.5 h-3.5 shrink-0" />
            <span>{t.auth.notOnServer}</span>
          </div>
        )}

        <div className={`flex items-center gap-2.5 ${canUseAI ? 'text-emerald-300' : 'text-red-400'}`}>
          <Bot className={`w-3.5 h-3.5 shrink-0 ${canUseAI ? 'text-emerald-400' : 'text-red-400/80'}`} />
          <span className="font-medium">{canUseAI ? t.auth.aiFeaturesOn : t.auth.aiFeaturesOff}</span>
        </div>
      </div>

      {/* Actions */}
      <div className="px-4 pb-4 pt-1 space-y-2">
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

        {!canUseAI && tier !== TIER.GUEST && trialDaysLeft === 0 && (
          <button
            onClick={() => window.electronAPI.openExternal(MEDIA_LINKS.boosty)}
            className="w-full flex items-center justify-center gap-2.5 h-10 rounded-xl border border-violet-500/20 bg-violet-500/[0.06] text-violet-300 text-[13px] font-medium hover:bg-violet-500/[0.1] hover:border-violet-500/30 transition-all duration-200"
          >
            <Crown className="w-3.5 h-3.5" />
            <span>{t.auth.getPremium}</span>
            <ExternalLink className="w-3 h-3 text-violet-400/50" />
          </button>
        )}

        <button
          onClick={handleLogout}
          disabled={isLoggingOut}
          className="w-full flex items-center justify-center gap-2.5 h-10 rounded-xl border border-white/[0.06] text-zinc-400 text-[13px] font-medium hover:text-red-400 hover:border-red-500/20 hover:bg-red-500/[0.04] transition-all duration-200 disabled:opacity-40"
        >
          <LogOut className="w-3.5 h-3.5" />
          {isLoggingOut ? t.auth.loggingOut : t.auth.logout}
        </button>
      </div>
    </div>
  );
}

// ─── Main ProfileBadge ──────────────────────────────────────────────────────────

export default function ProfileBadge({ onTogglePanel, isProfileOpen }) {
  const auth = useAuth();
  const { isLoggedIn, isLoading, isConfigured, user, tier, login } = auth;
  const t = useLocale();

  const [isOpen, setIsOpen] = useState(false);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [badgeRect, setBadgeRect] = useState(null);
  const badgeRef = useRef(null);
  const dropdownRef = useRef(null);

  // Capture badge position when dropdown opens
  useEffect(() => {
    if (isOpen && !onTogglePanel && badgeRef.current) {
      setBadgeRect(badgeRef.current.getBoundingClientRect());
    }
  }, [isOpen, onTogglePanel]);

  // Close dropdown on outside click (dropdown mode only)
  useEffect(() => {
    if (!isOpen || onTogglePanel) return;
    const handler = (e) => {
      if (
        badgeRef.current && !badgeRef.current.contains(e.target) &&
        dropdownRef.current && !dropdownRef.current.contains(e.target)
      ) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [isOpen, onTogglePanel]);

  // Don't render if auth system is not configured
  if (!isConfigured && !isLoading) return null;

  const handleLoginClick = async () => {
    setIsLoggingIn(true);
    const res = await login();
    setIsLoggingIn(false);
    if (!res?.success && res?.error) {
      notify.error(t.auth.loginError, res.error, 5000);
    }
  };

  // ── Guest / not logged in ─────────────────────────────────────────────────
  if (!isLoggedIn) {
    return (
      <button
        onClick={handleLoginClick}
        disabled={isLoggingIn || isLoading}
        title={t.auth.loginDiscord}
        className="group relative flex items-center gap-1.5 h-6 px-2 rounded-md border border-white/[0.08] bg-white/[0.03] text-zinc-400 hover:text-indigo-300 hover:border-indigo-400/30 hover:bg-indigo-400/[0.06] active:scale-[0.97] transition-all duration-200 disabled:opacity-40 disabled:pointer-events-none"
        style={{ WebkitAppRegion: 'no-drag' }}
      >
        <LogIn className="w-3 h-3" />
        <span className="text-[11px] font-semibold tracking-wide uppercase">
          {isLoggingIn ? '...' : t.auth.loginDiscord}
        </span>
      </button>
    );
  }

  // ── Logged in ─────────────────────────────────────────────────────────────
  const tierColor = TIER_COLORS[tier] || TIER_COLORS[TIER.GUEST];
  const panelActive = onTogglePanel ? isProfileOpen : isOpen;

  return (
    <>
      <button
        ref={badgeRef}
        onClick={() => onTogglePanel ? onTogglePanel() : setIsOpen((v) => !v)}
        title={user?.displayName || user?.username}
        className={`group relative flex items-center gap-1.5 h-6 px-1.5 rounded-md border transition-all duration-200 active:scale-[0.97] ${
          panelActive
            ? `border-white/[0.16] bg-white/[0.06]`
            : `border-white/[0.06] bg-transparent hover:border-white/[0.14] hover:bg-white/[0.04]`
        }`}
        style={{ WebkitAppRegion: 'no-drag' }}
      >
        {user?.avatar ? (
          <img src={user.avatar} alt="" className="w-4 h-4 rounded-full" />
        ) : (
          <User className="w-3.5 h-3.5 text-zinc-400" />
        )}
        <div className={`w-1.5 h-1.5 rounded-full ${tierColor.dot}`} />
        <ChevronDown className={`w-2.5 h-2.5 text-zinc-500 transition-transform duration-200 ${panelActive ? 'rotate-180' : ''}`} />
      </button>

      {!onTogglePanel && isOpen && badgeRect && createPortal(
        <div
          ref={dropdownRef}
          className="fixed z-[300]"
          style={{ top: badgeRect.bottom + 6, right: window.innerWidth - badgeRect.right }}
        >
          <ProfileDropdown onClose={() => setIsOpen(false)} />
        </div>,
        document.body,
      )}
    </>
  );
}
