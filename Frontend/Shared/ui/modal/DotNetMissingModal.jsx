import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { Download, AlertTriangle, X, CheckCircle2, Loader2 } from 'lucide-react';
import { useLocale } from '../../../Locales';

export default function DotNetMissingModal({ isOpen, onInstall, onDismiss }) {
  const t = useLocale();
  const [mounted, setMounted] = useState(false);
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState('idle'); // idle, installing, completed, error
  const [error, setError] = useState(null);

  // Handle mount/unmount animation
  useEffect(() => {
    if (!isOpen) return undefined;
    const raf = requestAnimationFrame(() => setMounted(true));
    return () => {
      cancelAnimationFrame(raf);
      setMounted(false);
    };
  }, [isOpen]);

  const handleInstall = async () => {
    setStatus('installing');
    setProgress(0);
    setError(null);

    try {
      await onInstall?.((progressValue) => {
        // -1 indicates installing phase without percentage
        if (progressValue === -1) {
          setProgress(100); // Show full bar during install
        } else {
          setProgress(progressValue);
        }
      });
      setStatus('completed');
    } catch (err) {
      setStatus('error');
      setError(err.message || t.dotnet.errorTitle);
    }
  };

  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 top-9 z-[300] flex items-center justify-center p-4" role="dialog" aria-modal="true">
      {/* Backdrop */}
      <div
        className="absolute inset-0 select-none"
        style={{
          background: 'radial-gradient(ellipse 70% 70% at 50% 50%, rgba(0,0,0,0.92) 0%, rgba(0,0,0,0.92) 35%, rgba(0,0,0,0.55) 70%, rgba(0,0,0,0.0) 95%)',
          backdropFilter: 'blur(12px)',
          opacity: mounted ? 1 : 0,
          transition: 'opacity 260ms ease-out',
        }}
        onClick={status === 'idle' ? onDismiss : undefined}
      />

      {/* Panel */}
      <div
        className="relative w-full max-w-lg rounded-3xl overflow-hidden shadow-[0_32px_80px_rgba(0,0,0,0.6)]"
        style={{
          opacity: mounted ? 1 : 0,
          transform: mounted ? 'translateY(0) scale(1)' : 'translateY(16px) scale(0.98)',
          transition: 'opacity 320ms cubic-bezier(0.16,1,0.3,1), transform 360ms cubic-bezier(0.16,1,0.3,1)',
        }}
      >
        {/* Glass surface */}
        <div className="absolute inset-0 bg-surface-2/98 backdrop-blur-2xl border border-white/[0.08] rounded-3xl" />
        <div className="absolute inset-x-0 top-0 h-[1px] bg-gradient-to-r from-transparent via-white/[0.14] to-transparent rounded-t-3xl" />

        <div className="relative z-10 flex flex-col p-8">
          {/* Close button */}
          {status === 'idle' && (
            <button
              type="button"
              onClick={onDismiss}
              className="absolute top-5 right-5 w-8 h-8 rounded-lg border border-white/[0.08] bg-white/[0.02] flex items-center justify-center text-zinc-400 hover:bg-white/[0.05] hover:text-zinc-300 transition-all"
            >
              <X className="w-4 h-4" />
            </button>
          )}

          {/* Icon */}
          <div className="flex items-center justify-center mb-6">
            <div className={`w-16 h-16 rounded-2xl flex items-center justify-center ${
              status === 'completed'
                ? 'bg-emerald-500/[0.12] border border-emerald-500/[0.25]'
                : status === 'installing'
                ? 'bg-indigo-500/[0.12] border border-indigo-500/[0.25]'
                : 'bg-amber-500/[0.12] border border-amber-500/[0.25]'
            }`}>
              {status === 'completed' ? (
                <CheckCircle2 className="w-8 h-8 text-emerald-400" />
              ) : status === 'error' ? (
                <AlertTriangle className="w-8 h-8 text-amber-400" />
              ) : status === 'installing' ? (
                <Loader2 className="w-8 h-8 text-indigo-400 animate-spin" />
              ) : (
                <AlertTriangle className="w-8 h-8 text-amber-400" />
              )}
            </div>
          </div>

          {/* Title */}
          <h2 className="text-[20px] font-semibold text-zinc-100 text-center mb-3">
            {status === 'completed'
              ? t.dotnet.installed
              : status === 'error'
              ? t.dotnet.errorTitle
              : status === 'installing'
              ? t.dotnet.installing
              : t.dotnet.title}
          </h2>

          {/* Description */}
          <p className="text-[13.5px] text-zinc-400 text-center leading-relaxed mb-6">
            {status === 'idle'
              ? t.dotnet.descriptionMissing
              : status === 'completed'
              ? t.dotnet.installedDesc
              : status === 'error'
              ? error
              : t.dotnet.waitMessage}
          </p>

          {/* Progress bar */}
          {status === 'installing' && (
            <div className="mb-6">
              <div className="h-2 bg-surface-3/60 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-emerald-500 to-emerald-400 transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <div className="flex justify-between mt-2 text-[11px] text-zinc-500">
                <span>{t.dotnet.installingLabel}</span>
                {progress < 100 && <span>{Math.round(progress)}%</span>}
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex flex-col gap-3">
            {status === 'idle' && (
              <button
                type="button"
                onClick={handleInstall}
                className="flex items-center justify-center gap-2 rounded-xl border border-emerald-400/30 bg-emerald-500/[0.14] text-emerald-100 px-6 py-3 text-[13px] font-semibold hover:bg-emerald-500/[0.22] hover:border-emerald-400/50 hover:shadow-[0_0_24px_rgba(16,185,129,0.25)] transition-all active:scale-[0.97]"
              >
                <Download className="w-4 h-4" />
                {t.dotnet.install}
              </button>
            )}

            {status === 'completed' && (
              <button
                type="button"
                onClick={onDismiss}
                className="rounded-xl border border-emerald-400/30 bg-emerald-500/[0.14] text-emerald-100 px-6 py-3 text-[13px] font-semibold hover:bg-emerald-500/[0.22] hover:border-emerald-400/50 hover:shadow-[0_0_24px_rgba(16,185,129,0.25)] transition-all active:scale-[0.97]"
              >
                {t.dotnet.continue}
              </button>
            )}

            {status === 'error' && (
              <>
                <button
                  type="button"
                  onClick={handleInstall}
                  className="rounded-xl border border-white/[0.08] bg-white/[0.02] text-zinc-300 px-6 py-3 text-[13px] font-medium hover:bg-white/[0.05] transition-all"
                >
                  {t.dotnet.retry}
                </button>
                <button
                  type="button"
                  onClick={onDismiss}
                  className="rounded-xl border border-white/[0.08] bg-white/[0.02] text-zinc-400 px-6 py-3 text-[13px] font-medium hover:bg-white/[0.05] hover:text-zinc-300 transition-all"
                >
                  {t.dotnet.close}
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
