import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Rocket, Sparkles } from 'lucide-react';
import useUpdater from './useUpdater';
import { useLocale } from '../../Locales';

// ─────────────────────────────────────────────────────────────────────────────
//  InstallingUpdateModal
//
//  Global, non-dismissable overlay that takes over the UI once the updater
//  state transitions to 'installing' (which happens when the user clicks
//  "Install" either in UpdatePanel or UpdateAvailableModal → both call
//  useUpdater().install() → backend sets status='installing').
//
//  Lifecycle:
//    1. Modal mounts. Smoothly animates a progress bar from 0 → 100 %
//       over ~2.2 seconds using an ease-out cubic curve (slow at the end).
//    2. When the animation hits 100 %, we briefly hold at 100 % for ~300 ms
//       so the user visually confirms completion, then call the backend
//       finalizeInstall() IPC. That spawns the silent NSIS installer and
//       immediately quits Electron — NSIS then replaces the .exe and
//       relaunches the new version.
//    3. If the app is somehow still alive 6 seconds after finalizeInstall
//       (very unexpected), we retry once. Otherwise NSIS will have killed
//       us long before that and this code never runs.
//
//  The modal is NOT closable by design: the install is already committed
//  on the backend side (status = 'installing') and we want to block any
//  further user interaction until the restart.
// ─────────────────────────────────────────────────────────────────────────────

const ANIMATION_DURATION_MS = 2200;   // 0 → 100 % animation length
const HOLD_AT_100_MS        = 300;    // brief pause so user sees 100 %
const FINALIZE_RETRY_MS     = 6000;   // safety retry if NSIS hasn't killed us

export default function InstallingUpdateModal() {
  const t = useLocale();
  const { state, currentVersion, finalizeInstall } = useUpdater();
  const [percent, setPercent] = useState(0);
  const startedRef = useRef(false);

  const isOpen = state.status === 'installing';

  useEffect(() => {
    if (!isOpen || startedRef.current) return undefined;
    startedRef.current = true;

    const startTime = performance.now();
    let rafId = 0;
    let holdTimeoutId = 0;
    let retryTimeoutId = 0;
    let finalized = false;

    const callFinalize = () => {
      if (finalized) return;
      finalized = true;
      try { finalizeInstall(); } catch { /* ignore */ }
      // Safety net — if NSIS hasn't killed us after 6 s, try finalize
      // again. Under normal circumstances this never fires because the
      // first call already triggered app.quit() on the backend.
      retryTimeoutId = window.setTimeout(() => {
        try { finalizeInstall(); } catch { /* ignore */ }
      }, FINALIZE_RETRY_MS);
    };

    const tick = (now) => {
      const elapsed = now - startTime;
      const linear  = Math.min(1, elapsed / ANIMATION_DURATION_MS);
      // Ease-out cubic — fast start, gentle arrival at 100 %
      const eased   = 1 - Math.pow(1 - linear, 3);
      setPercent(Math.round(eased * 100));

      if (linear < 1) {
        rafId = window.requestAnimationFrame(tick);
      } else {
        setPercent(100);
        holdTimeoutId = window.setTimeout(callFinalize, HOLD_AT_100_MS);
      }
    };
    rafId = window.requestAnimationFrame(tick);

    return () => {
      if (rafId)            window.cancelAnimationFrame(rafId);
      if (holdTimeoutId)    window.clearTimeout(holdTimeoutId);
      if (retryTimeoutId)   window.clearTimeout(retryTimeoutId);
    };
  }, [isOpen, finalizeInstall]);

  if (!isOpen) return null;

  const fromVersion = currentVersion || '—';
  const toVersion   = state.version   || '—';
  const phase       = pickPhase(percent);
  const phaseLabel  = t.updates.installing?.[phase] ?? phase;

  return createPortal(
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4" role="dialog" aria-modal="true">
      {/* Dimmed backdrop — NOT dismissable on click */}
      <div
        className="absolute inset-0 animate-[modalOverlayIn_0.2s_ease-out_both]"
        style={{
          background: 'radial-gradient(ellipse 60% 70% at 50% 50%, rgba(0,0,0,0.9) 0%, rgba(0,0,0,0.9) 30%, rgba(0,0,0,0.55) 65%, rgba(0,0,0,0.2) 100%)',
          backdropFilter: 'blur(10px)',
        }}
      />

      <div className="relative w-full max-w-md rounded-2xl overflow-hidden animate-[modalPanelIn_0.28s_cubic-bezier(0.16,1,0.3,1)_both]">
        <div className="absolute inset-0 bg-surface-2/98 backdrop-blur-2xl border border-white/[0.08] rounded-2xl shadow-[0_24px_64px_rgba(0,0,0,0.5)]" />
        <div className="absolute inset-x-0 top-0 h-[1px] bg-gradient-to-r from-transparent via-emerald-300/25 to-transparent rounded-t-2xl" />

        <div className="relative z-10 flex flex-col p-6">
          {/* Header with animated rocket icon */}
          <div className="flex items-center gap-4 mb-5">
            <div className="relative w-11 h-11 rounded-xl bg-emerald-500/[0.1] border border-emerald-500/[0.22] flex items-center justify-center shrink-0">
              <Rocket className="w-[22px] h-[22px] text-emerald-300" />
              <Sparkles className="absolute -top-1 -right-1 w-3 h-3 text-emerald-200/80 animate-[pulse_1.6s_ease-in-out_infinite]" />
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="text-[17px] font-semibold text-zinc-100 tracking-wide">
                {t.updates.installing?.title ?? 'Installing update'}
              </h2>
              <p className="text-[12.5px] text-zinc-500 mt-0.5">
                v{fromVersion} → v{toVersion}
              </p>
            </div>
          </div>

          {/* Progress bar */}
          <div className="space-y-2">
            <div className="h-2.5 rounded-full bg-white/[0.05] overflow-hidden relative">
              {/* Animated gradient fill */}
              <div
                className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-emerald-400 via-teal-300 to-emerald-400 bg-[length:200%_100%] transition-[width] duration-100 ease-out"
                style={{
                  width: `${percent}%`,
                  animation: 'bg3_installProgressShimmer 2.4s linear infinite',
                }}
              />
              {/* Glow at the leading edge */}
              <div
                className="absolute top-0 bottom-0 w-8 rounded-full bg-emerald-300/35 blur-md transition-[left] duration-100 ease-out pointer-events-none"
                style={{ left: `calc(${percent}% - 16px)` }}
              />
            </div>

            <div className="flex items-center justify-between text-[11.5px]">
              <span className="text-zinc-400">{phaseLabel}</span>
              <span className="font-mono text-zinc-300 tabular-nums">{percent}%</span>
            </div>
          </div>

          <p className="text-[11.5px] text-zinc-600 leading-relaxed mt-5 text-center">
            {t.updates.installing?.hint ?? 'Do not close the app — it will restart automatically.'}
          </p>
        </div>
      </div>

      {/* Shimmer keyframes — defined inline so we don't depend on tailwind config */}
      <style>{`
        @keyframes bg3_installProgressShimmer {
          0%   { background-position: 0% 0%; }
          100% { background-position: 200% 0%; }
        }
      `}</style>
    </div>,
    document.body
  );
}

// ─── phase picker ──────────────────────────────────────────────────────────
//  Turns the numeric progress into a locale key that the user sees as the
//  "what are we doing right now" caption under the progress bar.
function pickPhase(percent) {
  if (percent >= 100) return 'restarting';
  if (percent >= 85)  return 'finalizing';
  if (percent >= 20)  return 'installing';
  return 'preparing';
}
