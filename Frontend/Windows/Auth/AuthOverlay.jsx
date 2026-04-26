import React, { useState } from 'react';
import { useAuth, TIER } from '../../Core/logic/AuthCore';
import { useLocale } from '../../Locales';
import Modal from '../../Core/design/ModalCore';
import { notify } from '../../Shared/notificationCore_utils/notifications';
import { Shield, Gift, Crown, Clock, Sparkles, ExternalLink, AlertCircle } from 'lucide-react';
import { MEDIA_LINKS } from '../../Config/mediaConfig';

// ─── Discord Login Button (styled) ─────────────────────────────────────────────

function DiscordLoginButton({ onClick, isLoading }) {
  const t = useLocale();
  return (
    <button
      onClick={onClick}
      disabled={isLoading}
      className="group relative w-full flex items-center justify-center gap-2.5 h-11 rounded-xl border border-indigo-500/30 bg-indigo-500/[0.08] text-indigo-200 font-semibold text-[13px] hover:bg-indigo-500/[0.14] hover:border-indigo-400/40 hover:shadow-[0_0_24px_rgba(99,102,241,0.15)] active:scale-[0.98] transition-all duration-200 disabled:opacity-40 disabled:pointer-events-none overflow-hidden"
    >
      <span className="absolute inset-0 bg-gradient-to-r from-indigo-500/[0.04] via-transparent to-indigo-500/[0.04] opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      {/* Discord SVG icon */}
      <svg className="relative z-10 w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
        <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.095 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.095 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z" />
      </svg>
      <span className="relative z-10">{isLoading ? t.auth.connecting : t.auth.loginDiscord}</span>
    </button>
  );
}

// ─── AuthOverlay Modal ──────────────────────────────────────────────────────────

export default function AuthOverlay({ isOpen, onClose }) {
  const t = useLocale();
  const auth = useAuth();
  const { isLoggedIn, tier, trialDaysLeft, canUseAI, login, startTrial } = auth;

  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [isStartingTrial, setIsStartingTrial] = useState(false);
  const [trialError, setTrialError] = useState(null);

  const handleLogin = async () => {
    setIsLoggingIn(true);
    const res = await login();
    setIsLoggingIn(false);
    if (res?.success && (res.state?.tier === TIER.PREMIUM || res.state?.tier === TIER.TRIAL)) {
      onClose();
    } else if (!res?.success && res?.error) {
      notify.error(t.auth.loginError, res.error, 5000);
    }
  };

  const handleStartTrial = async () => {
    setIsStartingTrial(true);
    setTrialError(null);
    const res = await startTrial();
    setIsStartingTrial(false);
    if (res?.success) {
      onClose();
    } else {
      const msg = res?.error || t.auth.connectionError;
      setTrialError(msg);
    }
  };

  // Already has access — auto-close
  if (isOpen && canUseAI) {
    onClose();
    return null;
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={t.auth.aiModalTitle}
      subtitle={
        isLoggedIn
          ? t.auth.aiModalSubtitleAuth
          : t.auth.aiModalSubtitleGuest
      }
      icon={Shield}
      iconColorClass="text-indigo-300"
      iconBgClass="bg-indigo-500/[0.08]"
      iconBorderClass="border-indigo-500/20"
      showCloseIcon
      maxWidthClass="max-w-sm"
    >
      <div className="space-y-4">
        {/* Info card */}
        <div className="rounded-xl border border-violet-500/[0.1] bg-violet-500/[0.03] p-4">
          <div className="flex items-start gap-3">
            <Sparkles className="w-4 h-4 text-violet-300/60 mt-0.5 shrink-0" />
            <div className="text-[13px] text-zinc-400 leading-relaxed space-y-1.5">
              <p>{t.auth.aiModalDesc}</p>
              <p className="text-zinc-500">{t.auth.aiModalDescSub}</p>
            </div>
          </div>
        </div>

        {/* ── Not logged in ── */}
        {!isLoggedIn && (
          <div className="space-y-3">
            <DiscordLoginButton onClick={handleLogin} isLoading={isLoggingIn} />
            <p className="text-center text-[12px] text-zinc-600">
              {t.auth.loginSafe}
            </p>
          </div>
        )}

        {/* ── Logged in but FREE tier ── */}
        {isLoggedIn && tier === TIER.FREE && (
          <div className="space-y-3">
            {trialDaysLeft > 0 ? (
              <>
                <button
                  onClick={handleStartTrial}
                  disabled={isStartingTrial}
                  className="group relative w-full flex items-center justify-center gap-2.5 h-11 rounded-xl border border-amber-500/30 bg-amber-500/[0.08] text-amber-200 font-semibold text-[13px] hover:bg-amber-500/[0.14] hover:border-amber-400/40 hover:shadow-[0_0_24px_rgba(245,158,11,0.15)] active:scale-[0.98] transition-all duration-200 disabled:opacity-40 overflow-hidden"
                >
                  <Gift className="w-4 h-4" />
                  <span>{isStartingTrial ? t.auth.activating : t.auth.trialFreeBtn(trialDaysLeft)}</span>
                </button>
                {trialError && (
                  <div className="flex items-start gap-2 px-3 py-2.5 rounded-xl border border-red-500/20 bg-red-500/[0.06] text-red-300/80 text-[12px] leading-snug">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                    <span>{trialError}</span>
                  </div>
                )}
                <div className="text-center text-[12px] text-zinc-600">{t.common.or}</div>
              </>
            ) : (
              <div className="flex items-center gap-2.5 px-4 py-3 rounded-xl border border-white/[0.06] bg-white/[0.02]">
                <Clock className="w-4 h-4 text-zinc-500 shrink-0" />
                  <span className="text-[13px] text-zinc-400">{t.auth.trialEnded}</span>
              </div>
            )}

            <button
              onClick={() => window.electronAPI.openExternal(MEDIA_LINKS.boosty)}
              className="group w-full flex items-center justify-center gap-2.5 h-11 rounded-xl border border-violet-500/30 bg-violet-500/[0.08] text-violet-200 font-semibold text-[13px] hover:bg-violet-500/[0.14] hover:border-violet-400/40 hover:shadow-[0_0_24px_rgba(139,92,246,0.15)] active:scale-[0.98] transition-all duration-200"
            >
              <Crown className="w-4 h-4" />
              <span>{t.auth.getPremium}</span>
              <ExternalLink className="w-3 h-3 text-violet-400/50" />
            </button>
          </div>
        )}
      </div>
    </Modal>
  );
}
