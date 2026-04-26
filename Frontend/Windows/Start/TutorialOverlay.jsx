import React, { useState, useEffect, useCallback, useRef } from 'react';
import { ChevronRight, ChevronLeft, X } from 'lucide-react';
import { useLocale } from '../../Locales';

/**
 * Spotlight tutorial overlay for StartPage.
 * Highlights elements by `data-tutorial` attribute and shows a tooltip with step info.
 */
export default function TutorialOverlay({ steps, onComplete, onDismiss }) {
  const t = useLocale();
  const [currentStep, setCurrentStep] = useState(0);
  const [rect, setRect] = useState(null);
  const [visible, setVisible] = useState(false);
  const overlayRef = useRef(null);

  const step = steps[currentStep];

  // Measure target element
  const measure = useCallback(() => {
    if (!step) return;
    const el = document.querySelector(`[data-tutorial="${step.target}"]`);
    if (!el) return;
    const r = el.getBoundingClientRect();
    const pad = step.padding ?? 12;
    setRect({
      top: r.top - pad,
      left: r.left - pad,
      width: r.width + pad * 2,
      height: r.height + pad * 2,
    });
  }, [step]);

  useEffect(() => {
    // Defer measure + fade-in to avoid synchronous setState in effect body
    const raf = requestAnimationFrame(() => {
      measure();
      setVisible(true);
    });
    window.addEventListener('resize', measure);
    return () => {
      window.removeEventListener('resize', measure);
      cancelAnimationFrame(raf);
    };
  }, [measure]);

  const goNext = useCallback(() => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(s => s + 1);
    } else {
      onComplete();
    }
  }, [currentStep, steps.length, onComplete]);

  const goPrev = useCallback(() => {
    if (currentStep > 0) setCurrentStep(s => s - 1);
  }, [currentStep]);

  const handleSkip = useCallback(() => {
    onComplete();
  }, [onComplete]);

  const handleDismiss = useCallback(() => {
    (onDismiss || onComplete)();
  }, [onDismiss, onComplete]);

  if (!rect) return null;

  const isLast = currentStep === steps.length - 1;
  const isFirst = currentStep === 0;

  // Tooltip position — prefer bottom, fallback to top if not enough space
  const tooltipStyle = {};
  const gap = 16;
  const tooltipBelow = rect.top + rect.height + gap + 180 < window.innerHeight;

  if (tooltipBelow) {
    tooltipStyle.top = rect.top + rect.height + gap;
  } else {
    tooltipStyle.bottom = window.innerHeight - rect.top + gap;
  }

  // Horizontal: center-align with spotlight, clamp to screen
  const tooltipWidth = 340;
  let tooltipLeft = rect.left + rect.width / 2 - tooltipWidth / 2;
  tooltipLeft = Math.max(16, Math.min(tooltipLeft, window.innerWidth - tooltipWidth - 16));
  tooltipStyle.left = tooltipLeft;
  tooltipStyle.width = tooltipWidth;

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-[200] transition-opacity duration-300"
      style={{ opacity: visible ? 1 : 0 }}
    >
      {/* SVG overlay with spotlight cutout */}
      <svg className="absolute inset-0 w-full h-full" style={{ pointerEvents: 'none' }}>
        <defs>
          <mask id="tutorial-mask">
            <rect width="100%" height="100%" fill="white" />
            <rect
              x={rect.left}
              y={rect.top}
              width={rect.width}
              height={rect.height}
              rx={step.borderRadius ?? 16}
              fill="black"
            />
          </mask>
        </defs>
        <rect
          width="100%"
          height="100%"
          fill="rgba(0,0,0,0.7)"
          mask="url(#tutorial-mask)"
          style={{ pointerEvents: 'auto' }}
        />
      </svg>

      {/* Spotlight border ring */}
      <div
        className="absolute rounded-2xl border-2 border-blue-400/50 pointer-events-none transition-all duration-300"
        style={{
          top: rect.top,
          left: rect.left,
          width: rect.width,
          height: rect.height,
          borderRadius: step.borderRadius ?? 16,
          boxShadow: '0 0 0 4px rgba(96,165,250,0.15)',
        }}
      />

      {/* Tooltip card */}
      <div
        className="absolute bg-surface-2 border border-white/[0.12] rounded-2xl p-5 shadow-2xl transition-all duration-300"
        style={tooltipStyle}
      >
        {/* Step counter */}
        <div className="flex items-center justify-between mb-2">
          <span className="text-[11px] font-medium text-zinc-500 uppercase tracking-wider">
            {currentStep + 1} / {steps.length}
          </span>
          <button
            onClick={handleDismiss}
            className="text-zinc-500 hover:text-zinc-300 transition-colors p-1 -m-1"
            title={t.tutorial?.close || 'Close'}
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Title & description */}
        <h3 className="text-[15px] font-semibold text-zinc-100 mb-1.5">{step.title}</h3>
        <p className="text-[13px] text-zinc-400 leading-relaxed mb-4">{step.description}</p>

        {/* Navigation buttons */}
        <div className="flex items-center justify-between">
          <button
            onClick={handleSkip}
            className="text-[13px] text-zinc-500 hover:text-zinc-300 transition-colors"
          >
            {t.tutorial?.skip || 'Skip'}
          </button>
          <div className="flex items-center gap-2">
            {!isFirst && (
              <button
                onClick={goPrev}
                className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-[13px] text-zinc-300 bg-white/[0.06] hover:bg-white/[0.1] transition-colors"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
                {t.tutorial?.prev || 'Back'}
              </button>
            )}
            <button
              onClick={goNext}
              className="flex items-center gap-1 px-4 py-1.5 rounded-lg text-[13px] font-medium text-white bg-blue-600 hover:bg-blue-500 transition-colors"
            >
              {isLast ? (t.tutorial?.finish || 'Finish') : (t.tutorial?.next || 'Next')}
              {!isLast && <ChevronRight className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
