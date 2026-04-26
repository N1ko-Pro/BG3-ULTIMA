import React, { useState, useCallback } from 'react';
import { User, Clock, Shield, Bot, Sparkles, Gift, Crown, ExternalLink, LogOut, Check, Hash } from 'lucide-react';
import { useLocale } from '../../../Locales';
import { useAuth, TIER } from '../../../Core/logic/AuthCore';
import { notify } from '../../../Shared/notificationCore_utils/notifications';
import { MEDIA_LINKS } from '../../../Config/mediaConfig';
import { DiscordIcon } from '../../../Shared/SocialIcons';

export function ExpandedProfileContent({ isVisible }) {
  const t = useLocale();
  const {
    isLoggedIn, user, tier, trialDaysLeft, canUseAI, isInGuild,
    login, isLoading, logout, startTrial, localName, setLocalName,
  } = useAuth();

  const [loggingIn,       setLoggingIn]       = useState(false);
  const [isLoggingOut,    setIsLoggingOut]    = useState(false);
  const [isStartingTrial, setIsStartingTrial] = useState(false);
  const [editingName,     setEditingName]     = useState(false);
  const [nameValue,       setNameValue]       = useState(localName);

  const [prevIsVisible, setPrevIsVisible] = useState(isVisible);
  const [prevLocalName, setPrevLocalName] = useState(localName);
  if (prevIsVisible !== isVisible || prevLocalName !== localName) {
    setPrevIsVisible(isVisible);
    setPrevLocalName(localName);
    if (isVisible) {
      setNameValue(localName);
      setEditingName(false);
    }
  }

  const handleSaveName = useCallback(() => {
    setLocalName(nameValue);
    setEditingName(false);
    if (nameValue.trim()) {
      notify.success(t.auth.saveNameSuccess, t.auth.saveNameSuccessDesc, 2000);
    }
  }, [nameValue, setLocalName, t.auth.saveNameSuccess, t.auth.saveNameSuccessDesc]);

  const handleLogout = async () => {
    setIsLoggingOut(true);
    await logout();
    setIsLoggingOut(false);
  };

  const handleStartTrial = async () => {
    setIsStartingTrial(true);
    const res = await startTrial();
    setIsStartingTrial(false);
    if (res?.success) notify.success(t.auth.trialActivated, t.auth.trialActivatedDesc, 3000);
    else notify.error(t.auth.trialError, res?.error || t.auth.trialErrorDesc, 5000);
  };

  const canStartTrial = isLoggedIn && tier === TIER.FREE && trialDaysLeft > 0;

  return (
    <div
      className="space-y-4 transition-[opacity] duration-300"
      style={{ opacity: isVisible ? 1 : 0, transitionDelay: isVisible ? '200ms' : '0ms' }}
    >
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
          {user?.id && (
            <div className="flex items-center gap-2.5">
              <Hash className="w-3.5 h-3.5 shrink-0 text-zinc-600" />
              <span className="text-zinc-500 font-mono text-[12px]">{user.id}</span>
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
            <span className="font-medium">
              {canUseAI ? t.auth.aiFeaturesOn : t.auth.aiFeaturesOff}
            </span>
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
        {!isLoggedIn && (
          <button
            onClick={async () => {
              setLoggingIn(true);
              const res = await login();
              setLoggingIn(false);
              if (!res?.success && res?.error) {
                notify.error(t.auth.loginError, res.error, 5000);
              }
            }}
            disabled={loggingIn || isLoading}
            className="w-full flex items-center justify-center gap-2.5 h-10 rounded-xl border border-indigo-500/25 bg-indigo-500/[0.06] text-indigo-300 text-[13px] font-medium hover:bg-indigo-500/[0.12] hover:border-indigo-400/40 transition-all duration-200 disabled:opacity-40"
          >
            <DiscordIcon className="w-4 h-4" />
            {loggingIn ? t.auth.connecting : t.auth.loginDiscord}
          </button>
        )}
      </div>
    </div>
  );
}
