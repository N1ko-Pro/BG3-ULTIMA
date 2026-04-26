import React, { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Check, FileText, ArrowDown } from 'lucide-react';
import { getEulaText } from './eulaText';
import { FlagRU, FlagUS } from './FlagIcons';

// ─────────────────────────────────────────────────────────────────────────────
//  EulaModal
//  Full-screen-ish modal shown on first launch, before tutorials.
//    • Flag toggle (RU/US) in top-right switches the EULA language.
//    • Checkbox unlocks only after user scrolls to the bottom of the text.
//    • Clicking the label (once unlocked) toggles the checkbox too.
//    • "Continue" enabled only when the box is checked.
// ─────────────────────────────────────────────────────────────────────────────

export default function EulaModal({ isOpen, initialLang = 'ru', onAccept }) {
  const [lang, setLang] = useState(initialLang === 'en' ? 'en' : 'ru');
  const [scrolledToEnd, setScrolledToEnd] = useState(false);
  const [accepted, setAccepted] = useState(false);
  const [mounted, setMounted] = useState(false);
  const scrollRef = useRef(null);

  const text = getEulaText(lang);

  // Language change → reset acceptance + scroll (moved out of effect to avoid
  // setState-in-effect; the change is a user action, not a sync with state).
  const changeLang = useCallback((newLang) => {
    setLang(newLang);
    setScrolledToEnd(false);
    setAccepted(false);
    if (scrollRef.current) scrollRef.current.scrollTop = 0;
  }, []);

  // Animate in on open. setMounted(false) lives in the cleanup so we don't
  // call setState synchronously in the effect body.
  useEffect(() => {
    if (!isOpen) return undefined;
    const raf = requestAnimationFrame(() => setMounted(true));
    return () => {
      cancelAnimationFrame(raf);
      setMounted(false);
    };
  }, [isOpen]);

  // Detect scroll-to-end
  const handleScroll = useCallback((e) => {
    const el = e.currentTarget;
    const nearBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 24;
    if (nearBottom && !scrolledToEnd) setScrolledToEnd(true);
  }, [scrolledToEnd]);

  // Treat short texts / large windows where no scroll is required as
  // "already at end". Deferred via rAF so the setState is asynchronous.
  useEffect(() => {
    if (!isOpen) return undefined;
    const raf = requestAnimationFrame(() => {
      const el = scrollRef.current;
      if (el && el.scrollHeight <= el.clientHeight + 4) setScrolledToEnd(true);
    });
    return () => cancelAnimationFrame(raf);
  }, [isOpen, lang]);

  const handleLabelClick = () => {
    if (!scrolledToEnd) return;
    setAccepted((v) => !v);
  };

  const handleContinue = () => {
    if (!accepted) return;
    onAccept?.(lang);
  };

  const scrollToEnd = () => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' });
  };

  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 top-9 z-[200] flex items-center justify-center p-4" role="dialog" aria-modal="true">
      {/* Backdrop */}
      <div
        className="absolute inset-0 select-none"
        style={{
          background: 'radial-gradient(ellipse 70% 70% at 50% 50%, rgba(0,0,0,0.92) 0%, rgba(0,0,0,0.92) 35%, rgba(0,0,0,0.55) 70%, rgba(0,0,0,0.0) 95%)',
          backdropFilter: 'blur(12px)',
          opacity: mounted ? 1 : 0,
          transition: 'opacity 260ms ease-out',
        }}
      />

      {/* Panel */}
      <div
        className="relative w-full max-w-3xl h-[85vh] rounded-3xl overflow-hidden"
        style={{
          opacity: mounted ? 1 : 0,
          transform: mounted ? 'translateY(0) scale(1)' : 'translateY(16px) scale(0.98)',
          transition: 'opacity 320ms cubic-bezier(0.16,1,0.3,1), transform 360ms cubic-bezier(0.16,1,0.3,1)',
        }}
      >
        {/* Glass surface */}
        <div className="absolute inset-0 bg-surface-2/98 backdrop-blur-2xl border border-white/[0.08] rounded-3xl shadow-[0_32px_80px_rgba(0,0,0,0.6)]" />
        <div className="absolute inset-x-0 top-0 h-[1px] bg-gradient-to-r from-transparent via-white/[0.14] to-transparent rounded-t-3xl" />
        <div
          className="absolute inset-0 pointer-events-none rounded-3xl"
          style={{ background: 'radial-gradient(ellipse 50% 40% at 50% 0%, rgba(139,92,246,0.05) 0%, transparent 70%)' }}
        />

        <div className="relative z-10 flex flex-col h-full">
          {/* Header */}
          <div className="px-7 py-5 border-b border-white/[0.06] flex items-center gap-4 shrink-0">
            <div className="w-11 h-11 rounded-2xl bg-indigo-500/[0.08] border border-indigo-500/[0.18] flex items-center justify-center shrink-0">
              <FileText className="w-5 h-5 text-indigo-300" />
            </div>
            <div className="min-w-0 flex-1">
              <h2 className="text-[18px] font-semibold text-zinc-100 tracking-wide truncate">{text.title}</h2>
              <p className="text-[12.5px] text-zinc-500 mt-0.5 truncate">{text.subtitle}</p>
            </div>

            {/* Language flags */}
            <div className="flex items-center gap-1.5 shrink-0">
              <LangFlagButton active={lang === 'ru'} onClick={() => changeLang('ru')}><FlagRU /></LangFlagButton>
              <LangFlagButton active={lang === 'en'} onClick={() => changeLang('en')}><FlagUS /></LangFlagButton>
            </div>
          </div>

          {/* Intro */}
          <div className="px-7 pt-5">
            <p className="text-[13px] text-zinc-400 leading-relaxed">{text.intro}</p>
          </div>

          {/* Scrollable EULA body */}
          <div className="flex-1 relative mt-4 mx-5 mb-4 rounded-2xl border border-white/[0.07] bg-surface-1/60 overflow-hidden">
            <div
              ref={scrollRef}
              onScroll={handleScroll}
              className="h-full overflow-y-auto px-6 py-5 space-y-5 custom-scrollbar select-text"
              style={{ scrollbarGutter: 'stable' }}
            >
              {text.sections.map((s, idx) => (
                <section key={idx}>
                  <h3 className="text-[13px] font-semibold text-zinc-200 tracking-wide mb-2">{s.heading}</h3>
                  <p className="text-[12.5px] text-zinc-400 leading-relaxed whitespace-pre-line">{s.body}</p>
                </section>
              ))}
              <div className="h-2" />
            </div>

            {/* Fade gradient at bottom while not scrolled to end */}
            <div
              className="pointer-events-none absolute inset-x-0 bottom-0 h-14 rounded-b-2xl"
              style={{
                background: 'linear-gradient(to top, rgba(15,15,19,0.9), rgba(15,15,19,0))',
                opacity: scrolledToEnd ? 0 : 1,
                transition: 'opacity 260ms ease-out',
              }}
            />

            {/* Scroll-to-bottom helper */}
            <button
              type="button"
              onClick={scrollToEnd}
              className="absolute bottom-3 right-3 flex items-center gap-1.5 rounded-full border border-white/[0.1] bg-surface-3/80 backdrop-blur px-3 py-1.5 text-[11px] font-medium text-zinc-300 hover:bg-surface-4/80 hover:text-zinc-100 transition-all"
              style={{
                opacity: scrolledToEnd ? 0 : 1,
                pointerEvents: scrolledToEnd ? 'none' : 'auto',
                transform: scrolledToEnd ? 'translateY(8px)' : 'translateY(0)',
                transition: 'opacity 240ms ease-out, transform 240ms ease-out',
              }}
            >
              <ArrowDown className="w-3 h-3" />
              {lang === 'ru' ? 'К концу' : 'Jump to end'}
            </button>
          </div>

          {/* Footer: checkbox + continue button */}
          <div className="px-7 pb-6 pt-2 shrink-0 space-y-4">
            <button
              type="button"
              onClick={handleLabelClick}
              disabled={!scrolledToEnd}
              className={`group w-full flex items-start gap-3 text-left rounded-2xl border px-4 py-3 transition-all ${
                scrolledToEnd
                  ? (accepted
                      ? 'border-emerald-400/25 bg-emerald-500/[0.06] hover:bg-emerald-500/[0.09]'
                      : 'border-white/[0.08] bg-surface-3/40 hover:bg-surface-3/60 hover:border-white/[0.14]')
                  : 'border-white/[0.05] bg-surface-3/20 cursor-not-allowed opacity-70'
              }`}
            >
              <span
                className={`mt-0.5 shrink-0 w-5 h-5 rounded-md border flex items-center justify-center transition-all ${
                  accepted
                    ? 'border-emerald-400/50 bg-emerald-500/25'
                    : 'border-white/[0.18] bg-surface-4/40 group-hover:border-white/[0.3]'
                }`}
              >
                <Check
                  className="w-3 h-3 text-emerald-300"
                  style={{
                    opacity: accepted ? 1 : 0,
                    transform: accepted ? 'scale(1)' : 'scale(0.6)',
                    transition: 'opacity 180ms ease-out, transform 240ms cubic-bezier(0.34,1.56,0.64,1)',
                  }}
                />
              </span>
              <span className="flex-1 min-w-0">
                <span className={`block text-[13px] font-semibold ${accepted ? 'text-emerald-200' : 'text-zinc-200'}`}>
                  {text.accept}
                </span>
                {!scrolledToEnd && (
                  <span className="block text-[11px] text-zinc-500 mt-1">{text.acceptHintLocked}</span>
                )}
              </span>
            </button>

            <div className="flex items-center justify-between gap-4">
              <span className="text-[11px] text-zinc-600">{text.declineHint}</span>
              <button
                type="button"
                onClick={handleContinue}
                disabled={!accepted}
                className={`rounded-xl px-6 py-2.5 text-[13px] font-semibold transition-all ${
                  accepted
                    ? 'border border-indigo-400/30 bg-indigo-500/[0.14] text-indigo-100 hover:bg-indigo-500/[0.22] hover:border-indigo-400/50 hover:shadow-[0_0_24px_rgba(139,92,246,0.25)] active:scale-[0.97]'
                    : 'border border-white/[0.06] bg-white/[0.02] text-zinc-600 cursor-not-allowed'
                }`}
              >
                {text.continue}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}

function LangFlagButton({ active, onClick, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-9 h-8 rounded-lg border flex items-center justify-center transition-all ${
        active
          ? 'border-white/[0.22] bg-white/[0.08] shadow-[0_0_0_3px_rgba(139,92,246,0.15)]'
          : 'border-white/[0.06] bg-white/[0.02] hover:bg-white/[0.06] hover:border-white/[0.14] opacity-70 hover:opacity-100'
      }`}
    >
      {children}
    </button>
  );
}
