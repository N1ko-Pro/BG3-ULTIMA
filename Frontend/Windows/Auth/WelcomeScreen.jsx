import React, { useState, useCallback, useRef, useEffect } from 'react';
import { ArrowRight } from 'lucide-react';
import { useAuth } from '../../Core/logic/AuthCore';
import { useLocale } from '../../Locales';
import { notify } from '../../Shared/notificationCore_utils/notifications';
import { GitHubIcon, DiscordIcon, BoostyIcon, NexusIcon } from '../../Shared/SocialIcons';
import { MEDIA_LINKS } from '../../Config/mediaConfig';
import logoSrc from '../../Assets/logo.png';
import pkg from '../../../package.json';

import { getFeatures } from './WelcomeScreen_Utils/constants';
import { FeatureCard } from './WelcomeScreen_Utils/FeatureCard';
import { UserStatusCard } from './WelcomeScreen_Utils/UserStatusCard';
import { ExpandedProfileContent } from './WelcomeScreen_Utils/ExpandedProfileContent';
import TutorialOverlay from '../../Shared/TutorialOverlay';

// ─── Home Page ──────────────────────────────────────────────────────────────────

export default function HomePage({ onNavigateToProjects, isOverlay = false, isFirstLaunch = false }) {
  const t = useLocale();
  const { login, isLoading, isLoggedIn, user, tier, trialDaysLeft, isOffline } = useAuth();
  const [loggingIn,         setLoggingIn]         = useState(false);
  const [isProfileExpanded, setIsProfileExpanded] = useState(false);
  const [cardsHidden,       setCardsHidden]       = useState(false);
  const [profileHeight,     setProfileHeight]     = useState(0);
  const [gridHeight,        setGridHeight]        = useState(0);
  const profileRef = useRef(null);
  const gridRef = useRef(null);
  const appVersion  = pkg?.version || '0.0.0';
  const currentYear = new Date().getFullYear();
  const features    = getFeatures(t);
  const [showTutorial, setShowTutorial] = useState(isFirstLaunch);

  // Measure profile panel and grid heights when expanded
  useEffect(() => {
    if (isProfileExpanded && profileRef.current) {
      setProfileHeight(profileRef.current.offsetHeight);
    } else if (!isProfileExpanded) {
      setProfileHeight(0);
    }
  }, [isProfileExpanded]);

  useEffect(() => {
    if (gridRef.current) {
      setGridHeight(gridRef.current.offsetHeight);
    }
  }, [cardsHidden]); // Grid height changes when cards are hidden

  // Calculate overlap margin (only if profile extends beyond grid)
  const overlapMargin = Math.max(0, profileHeight - gridHeight);

  // Collapse profile panel when user logs out
  React.useEffect(() => {
    if (!isLoggedIn && (isProfileExpanded || cardsHidden)) {
      setIsProfileExpanded(false);
      setTimeout(() => setCardsHidden(false), 380);
    }
  }, [isLoggedIn]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleToggleProfile = useCallback(() => {
    if (!isProfileExpanded) {
      setCardsHidden(true);
      setTimeout(() => setIsProfileExpanded(true), 320);
    } else {
      setIsProfileExpanded(false);
      setTimeout(() => setCardsHidden(false), 380);
    }
  }, [isProfileExpanded]);

  const handleLogin = async () => {
    setLoggingIn(true);
    const res = await login();
    setLoggingIn(false);
    if (!res?.success && res?.error) {
      notify.error(t.auth.loginError, res.error, 5000);
    }
  };

  return (
    <div className="flex-1 flex flex-col overflow-hidden relative">
      {/* Background layers */}
      <div className="absolute inset-0 bg-surface-0" />
      <div className="absolute inset-0 dot-grid opacity-20 pointer-events-none" />
      <div
        className="absolute inset-0 pointer-events-none"
        style={{ background: 'radial-gradient(ellipse 60% 50% at 50% 30%, rgba(139,92,246,0.06) 0%, transparent 70%)' }}
      />
      <svg className="noise-overlay" aria-hidden="true">
        <filter id="homeNoise">
          <feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="4" stitchTiles="stitch" />
        </filter>
        <rect width="100%" height="100%" filter="url(#homeNoise)" />
      </svg>

      {/* Scrollable content */}
      <div className="relative z-10 flex-1 overflow-y-auto overflow-x-hidden">
        <div className="flex flex-col items-center px-6 pt-8 pb-4 w-full max-w-[600px] mx-auto">

          {/* Logo — transparent background */}
          <div className="app-slide-up">
            <img src={logoSrc} alt="BG3 Ultima" className="w-24 h-24 object-contain drop-shadow-[0_0_24px_rgba(139,92,246,0.2)]" />
          </div>

          {/* Hero text — from StartPage */}
          <div className="flex flex-col items-center text-center mb-5 app-slide-up" style={{ animationDelay: '50ms' }}>
            <div className="relative mb-2">
              <div className="absolute inset-0 blur-[60px] bg-white/[0.04] rounded-full scale-[2.5]" />
              <h1 className="relative text-4xl font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-b from-white via-zinc-300 to-zinc-600">
                BG3 ULTIMA
              </h1>
            </div>
            <p className="text-zinc-500 text-[14px] font-medium max-w-sm leading-relaxed">
              {t.welcome.tagline}
            </p>
          </div>

          {/* User status or auth prompt */}
          {isLoggedIn ? (
            <div
              className="relative z-20 w-full mb-6 transition-all duration-500 ease-[cubic-bezier(0.4,0,0.2,1)]"
              style={{ maxWidth: isProfileExpanded ? '340px' : '100%' }}
            >
              <UserStatusCard
                user={user}
                tier={tier}
                trialDaysLeft={trialDaysLeft}
                isExpanded={isProfileExpanded}
                onToggle={handleToggleProfile}
              />
            </div>
          ) : null}

          {/* Offline banner */}
          {isOffline && (
            <div className="w-full flex items-center gap-2 px-3 py-2 mb-5 rounded-lg border border-amber-500/20 bg-amber-500/[0.06] text-amber-300/80 text-[13px] app-slide-up" style={{ animationDelay: '100ms' }}>
              <div className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse shrink-0" />
              {t.welcome.offlineBanner}
            </div>
          )}

          {/* Grid + profile overlay — grid always holds its height, button never moves */}
          <div ref={gridRef} className="relative w-full mb-5" data-tutorial="home-features">
            {/* Feature grid — never changes height, cards only animate visually */}
            <div
              className="w-full grid grid-cols-2 gap-3.5"
              style={{ pointerEvents: cardsHidden ? 'none' : 'auto' }}
            >
              {features.map((f, i) => {
                const scatterX = i % 2 === 0 ? -80 : 80;
                return (
                  <div
                    key={f.title}
                    className="transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] h-full"
                    style={{
                      opacity: cardsHidden ? 0 : 1,
                      transform: cardsHidden
                        ? `translateX(${scatterX}px) scale(0.88)`
                        : 'translateX(0) scale(1)',
                      transitionDelay: cardsHidden ? `${i * 35}ms` : `${(3 - i) * 35}ms`,
                    }}
                  >
                    <FeatureCard {...f} index={i} />
                  </div>
                );
              })}
            </div>

            {/* Profile panel — absolute overlay, grows downward, zero layout impact on button */}
            {isLoggedIn && (
              <div
                ref={profileRef}
                className="absolute top-0 left-0 right-0 z-10 flex justify-center transition-all duration-500 ease-[cubic-bezier(0.4,0,0.2,1)] isolate"
                style={{
                  opacity: isProfileExpanded ? 1 : 0,
                  pointerEvents: isProfileExpanded ? 'auto' : 'none',
                  transform: isProfileExpanded ? 'translateY(0) scale(1)' : 'translateY(12px) scale(0.97)',
                  transformOrigin: 'top center',
                }}
              >
                <div className="w-full max-w-[340px] rounded-xl border border-white/[0.08] bg-white/[0.03] backdrop-blur-xl p-5 shadow-[0_8px_40px_rgba(0,0,0,0.4)]">
                  <ExpandedProfileContent isVisible={isProfileExpanded} />
                </div>
              </div>
            )}
          </div>

          {/* Button — in normal flow, always right below grid, never moves */}
          <div
            className="w-full space-y-3 transition-all duration-500 ease-[cubic-bezier(0.4,0,0.2,1)] isolate"
            style={{
              maxWidth: isProfileExpanded ? '340px' : '100%',
              marginTop: `${overlapMargin}px`,
            }}
          >
            <button
              data-tutorial="home-start-btn"
              onClick={onNavigateToProjects}
              className="group relative w-full flex items-center justify-center gap-2.5 h-12 rounded-xl border border-white/[0.5] bg-white/[0.88] text-zinc-800 font-semibold text-[16px] hover:bg-white/[0.96] hover:border-white/[0.75] hover:text-zinc-900 active:scale-[0.98] transition-all duration-200 overflow-hidden"
            >
              <span className="relative z-10">{isFirstLaunch ? t.welcome.getStarted : (isOverlay ? t.welcome.backToProjects : t.welcome.myProjects)}</span>
              <ArrowRight className="relative z-10 w-4 h-4 text-zinc-500 group-hover:text-zinc-700 group-hover:translate-x-0.5 transition-all duration-200" />
            </button>
            {!isLoggedIn && (
              <div data-tutorial="home-login-btn">
                <button
                  onClick={handleLogin}
                  disabled={loggingIn || isLoading || isOffline}
                  className="group relative w-full flex items-center justify-center gap-2.5 h-12 rounded-xl border border-indigo-500/25 bg-indigo-500/[0.06] text-indigo-300 font-semibold text-[15px] hover:bg-indigo-500/[0.12] hover:border-indigo-400/40 hover:shadow-[0_0_32px_rgba(99,102,241,0.15)] active:scale-[0.98] transition-all duration-200 disabled:opacity-40 disabled:pointer-events-none overflow-hidden"
                >
                  <DiscordIcon className="relative z-10 w-5 h-5" />
                  <span className="relative z-10">
                    {loggingIn ? t.welcome.connecting : t.welcome.loginDiscord}
                  </span>
                </button>
              </div>
            )}
            {!isLoggedIn && (
              <p className="text-center text-[13px] text-zinc-500 leading-relaxed pt-1">
                {t.welcome.loginPrompt}
                <br />
                <span className="text-zinc-600">{t.welcome.loginPromptGuest}</span>
              </p>
            )}
          </div>
          <div data-tutorial="home-social" className="relative z-20 flex items-center justify-center gap-5 pt-5 pb-2">
            <button
              onClick={() => window.electronAPI.openExternal(MEDIA_LINKS.github)}
              title="GitHub"
              className="group flex items-center justify-center w-11 h-11 rounded-full border border-white/[0.08] bg-white/[0.03] backdrop-blur-xl text-zinc-500 hover:text-zinc-200 hover:border-zinc-400/30 hover:bg-zinc-400/[0.08] hover:shadow-[0_0_20px_rgba(255,255,255,0.08)] hover:scale-110 active:scale-95 transition-all duration-300"
            >
              <GitHubIcon className="w-5 h-5" />
            </button>
            <button
              onClick={() => window.electronAPI.openExternal(MEDIA_LINKS.discord)}
              title="Discord"
              className="group flex items-center justify-center w-11 h-11 rounded-full border border-white/[0.08] bg-white/[0.03] backdrop-blur-xl text-zinc-500 hover:text-indigo-400 hover:border-indigo-400/30 hover:bg-indigo-400/[0.08] hover:shadow-[0_0_20px_rgba(99,102,241,0.15)] hover:scale-110 active:scale-95 transition-all duration-300"
            >
              <DiscordIcon className="w-5 h-5" />
            </button>
            <button
              onClick={() => window.electronAPI.openExternal(MEDIA_LINKS.boosty)}
              title="Boosty"
              className="group flex items-center justify-center w-11 h-11 rounded-full border border-white/[0.08] bg-white/[0.03] backdrop-blur-xl text-zinc-500 hover:text-orange-400 hover:border-orange-400/30 hover:bg-orange-400/[0.08] hover:shadow-[0_0_20px_rgba(251,146,60,0.15)] hover:scale-110 active:scale-95 transition-all duration-300"
            >
              <BoostyIcon className="w-5 h-5" />
            </button>
            <button
              onClick={() => window.electronAPI.openExternal(MEDIA_LINKS.nexusMods)}
              title="Nexus Mods"
              className="group flex items-center justify-center w-11 h-11 rounded-full border border-white/[0.08] bg-white/[0.03] backdrop-blur-xl text-zinc-500 hover:text-amber-400 hover:border-amber-400/30 hover:bg-amber-400/[0.08] hover:shadow-[0_0_20px_rgba(251,191,36,0.15)] hover:scale-110 active:scale-95 transition-all duration-300"
            >
              <NexusIcon className="w-5 h-5" />
            </button>
          </div>

        </div>
      </div>

      {/* Footer — fixed at bottom */}
      <div className="relative z-20 shrink-0 border-t border-white/[0.04] bg-surface-0/80 backdrop-blur-xl">
        <div className="flex items-center justify-between px-8 py-3">
          <p className="text-[12px] font-medium tracking-wide text-zinc-600 select-none">
          {t.welcome.copyright(currentYear)}
          </p>
          <p className="text-[12px] font-medium tracking-wide text-zinc-600 select-none">
            {t.welcome.version(appVersion)}
          </p>
        </div>
      </div>

      {/* First-launch tutorial (shown once, not resettable) */}
      {showTutorial && (
        <TutorialOverlay
          id="welcome"
          steps={[
            {
              title: t.tutorialWelcome?.stepWelcome?.title || 'Welcome!',
              description: t.tutorialWelcome?.stepWelcome?.desc || 'Welcome to BG3 ULTIMA.',
            },
            {
              targets: ['home-features', 'home-login-btn'],
              title: t.tutorialWelcome?.stepFeatures?.title || 'Features & Sign In',
              description: t.tutorialWelcome?.stepFeatures?.desc || 'Explore tools and sign in via Discord.',
              tooltipAnchor: 'home-login-btn',
              position: 'below',
              padding: 14,
              borderRadius: 20,
            },
            {
              target: 'home-social',
              title: t.tutorialWelcome?.stepSocial?.title || 'Our Community',
              description: t.tutorialWelcome?.stepSocial?.desc || 'Find us on Discord, Boosty and Nexus Mods.',
              padding: 12,
              borderRadius: 16,
            },
            {
              target: 'home-start-btn',
              title: t.tutorialWelcome?.stepGuest?.title || 'No Account? No Problem.',
              description: t.tutorialWelcome?.stepGuest?.desc || 'You can continue as a guest and access the core tools right away.',
              padding: 10,
              borderRadius: 14,
            },
          ]}
          onComplete={() => setShowTutorial(false)}
          onDismiss={() => setShowTutorial(false)}
        />
      )}
    </div>
  );
}
