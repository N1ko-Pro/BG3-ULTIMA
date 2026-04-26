import React, { useMemo } from 'react';
import { createPortal } from 'react-dom';
import { X, Download, Sparkles, Rocket } from 'lucide-react';
import useUpdater from './useUpdater';
import { useLocale } from '../../Locales';

// ─────────────────────────────────────────────────────────────────────────────
//  UpdateAvailableModal
//  A non-intrusive notification that pops once per update-available event.
//  Suppressed while a tutorial is active — App.jsx handles the gating.
// ─────────────────────────────────────────────────────────────────────────────

export default function UpdateAvailableModal({ isOpen, onDismiss }) {
  const t = useLocale();
  const { state, currentVersion, download, install } = useUpdater();

  const notes = useMemo(() => stripHtml(state.info?.releaseNotes || ''), [state.info?.releaseNotes]);
  const isReady = state.status === 'downloaded';
  const isDownloading = state.status === 'download-progress';
  const percent = state.progress?.percent ?? 0;

  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 z-[150] flex items-center justify-center p-4" role="dialog" aria-modal="true">
      <div
        className="absolute inset-0 animate-[modalOverlayIn_0.2s_ease-out_both]"
        style={{
          background: 'radial-gradient(ellipse 56% 66% at 50% 50%, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.85) 30%, rgba(0,0,0,0.4) 65%, rgba(0,0,0,0.0) 90%)',
          backdropFilter: 'blur(8px)',
        }}
        onClick={onDismiss}
      />

      <div className="relative w-full max-w-md rounded-2xl overflow-hidden animate-[modalPanelIn_0.25s_cubic-bezier(0.16,1,0.3,1)_both]">
        <div className="absolute inset-0 bg-surface-2/98 backdrop-blur-2xl border border-white/[0.08] rounded-2xl shadow-[0_24px_64px_rgba(0,0,0,0.5)]" />
        <div className="absolute inset-x-0 top-0 h-[1px] bg-gradient-to-r from-transparent via-indigo-300/20 to-transparent rounded-t-2xl" />

        <div className="relative z-10 flex flex-col">
          <div className="p-6 border-b border-white/[0.06] flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/[0.1] border border-indigo-500/[0.22] flex items-center justify-center shrink-0">
              <Sparkles className="w-5 h-5 text-indigo-300" />
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="text-[17px] font-semibold text-zinc-100 tracking-wide">
                {isReady ? t.updates.modal.readyTitle : t.updates.modal.availableTitle}
              </h2>
              <p className="text-[12.5px] text-zinc-500 mt-0.5">
                {state.version
                  ? t.updates.modal.subtitle(currentVersion || '—', state.version)
                  : t.updates.available(state.version || '?')}
              </p>
            </div>
            <button
              type="button"
              onClick={onDismiss}
              className="absolute right-4 top-4 w-7 h-7 text-zinc-600 hover:text-zinc-200 transition-all duration-200 rounded-full flex items-center justify-center hover:bg-white/[0.08]"
              aria-label="Close"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="p-6 space-y-4 select-text">
            <p className="text-[13px] text-zinc-300 leading-relaxed">
              {isReady ? t.updates.modal.readyBody : t.updates.modal.availableBody}
            </p>

            {notes && (
              <div className="rounded-xl border border-white/[0.06] bg-surface-1/40 p-3 max-h-44 overflow-y-auto">
                <p className="text-[11px] uppercase tracking-wider font-semibold text-zinc-500 mb-1.5">
                  {t.updates.whatsNew}
                </p>
                <pre className="text-[12px] text-zinc-400 whitespace-pre-wrap font-sans leading-relaxed">
                  {notes}
                </pre>
              </div>
            )}

            {isDownloading && (
              <div className="space-y-1.5">
                <div className="h-2 rounded-full bg-white/[0.05] overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-indigo-400 via-violet-400 to-indigo-400 transition-[width] duration-200 ease-out"
                    style={{ width: `${percent}%` }}
                  />
                </div>
                <p className="text-[11px] text-zinc-500 text-right">{percent}%</p>
              </div>
            )}
          </div>

          <div className="p-6 pt-2 flex items-center gap-3">
            <button
              onClick={onDismiss}
              className="flex-1 rounded-xl border border-white/[0.08] bg-white/[0.04] px-4 py-2.5 text-[13px] font-semibold text-zinc-400 hover:bg-white/[0.08] hover:text-zinc-200 transition-all duration-150"
            >
              {t.updates.modal.later}
            </button>
            {isReady ? (
              <button
                onClick={() => { install(); }}
                className="flex-1 rounded-xl border border-emerald-400/30 bg-emerald-500/[0.12] px-4 py-2.5 text-[13px] font-semibold text-emerald-200 hover:bg-emerald-500/[0.22] hover:border-emerald-400/50 hover:shadow-[0_0_16px_rgba(52,211,153,0.25)] transition-all duration-150 flex items-center justify-center gap-2"
              >
                <Rocket className="w-4 h-4" />
                {t.updates.install}
              </button>
            ) : (
              <button
                onClick={() => { if (!isDownloading) download(); }}
                disabled={isDownloading}
                className="flex-1 rounded-xl border border-indigo-400/30 bg-indigo-500/[0.12] px-4 py-2.5 text-[13px] font-semibold text-indigo-200 hover:bg-indigo-500/[0.22] hover:border-indigo-400/50 hover:shadow-[0_0_16px_rgba(139,92,246,0.25)] transition-all duration-150 disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                <Download className="w-4 h-4" />
                {isDownloading ? t.updates.downloading : t.updates.download}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}

function stripHtml(html) {
  if (!html) return '';
  return html
    .replace(/<li[^>]*>/gi, '• ')
    .replace(/<\/(p|li|div|h\d)>/gi, '\n')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}
