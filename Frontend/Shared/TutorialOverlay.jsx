import React, { useState, useEffect, useLayoutEffect, useCallback, useRef } from 'react';
import { ChevronRight, ChevronLeft } from 'lucide-react';
import { useLocale } from '../Locales';

/**
 * Spotlight tutorial overlay.
 * Highlights elements by `data-tutorial` attribute and shows a tooltip with step info.
 *
 * Props:
 *  - steps: [{ target, title, description, padding?, borderRadius?, delay? }]
 *  - onComplete:    called when user finishes all steps or clicks "Skip"
 *  - onDismiss:     called when user clicks X (close) — does NOT mark tutorial as done
 *  - onBeforeStep:  (index) => void — called before transitioning to a step;
 *                   use to open panels, switch tabs, etc. The overlay waits `step.delay` ms
 *                   after calling this before measuring.
 *  - id:            unique string to namespace the SVG mask (avoids clashes if multiple overlays)
 */
export default function TutorialOverlay({ steps, onComplete, onDismiss, onBeforeStep, id = 'tutorial' }) {
  const t = useLocale();
  const [currentStep, setCurrentStep] = useState(0);
  const [rects, setRects] = useState(null);
  const [visible, setVisible] = useState(false);
  const [tooltipH, setTooltipH] = useState(200);
  const [isTracking, setIsTracking] = useState(false);
  const overlayRef = useRef(null);
  const tooltipRef = useRef(null);
  const measureTimerRef = useRef(null);
  const trackingRAFRef = useRef(null);
  const prevStepRef = useRef(null);
  const isTrackingRef = useRef(false);

  const step = steps[currentStep];
  const maskId = `${id}-mask-${currentStep}`;
  const rect = rects?.[0] ?? null;
  const hasSpotlight = Array.isArray(rects) && rects.length > 0;

  // Measure target element(s) — supports `step.target` (string) or `step.targets` (array)
  const measure = useCallback(() => {
    if (!step) return;
    const targetNames = step.targets
      ? step.targets
      : step.target
        ? [step.target]
        : [];
    // No targets = full-screen / centered mode (dark overlay, centered tooltip, no spotlight)
    if (!targetNames.length) {
      setRects([]);
      return;
    }
    const pad = step.padding ?? 12;
    const newRects = targetNames.map(name => {
      const el = document.querySelector(`[data-tutorial="${name}"]`);
      if (!el) return null;
      const r = el.getBoundingClientRect();
      return {
        top: r.top - pad,
        left: r.left - pad,
        width: r.width + pad * 2,
        height: r.height + pad * 2,
      };
    }).filter(Boolean);
    if (newRects.length) setRects(newRects);
  }, [step]);

  // Run onBeforeStep + delayed/tracked measure when step changes
  useEffect(() => {
    clearTimeout(measureTimerRef.current);
    cancelAnimationFrame(trackingRAFRef.current);

    const prevStep = prevStepRef.current;
    prevStepRef.current = currentStep;

    const config = onBeforeStep ? (onBeforeStep(currentStep, prevStep) ?? null) : null;
    const delay  = (typeof config === 'number' ? config : config?.delay) ?? step?.delay ?? 0;
    const track  = typeof config === 'object' && config !== null ? (config.track ?? 0) : 0;

    const doMeasure = () => {
      const wasTracking = isTrackingRef.current;

      if (track > 0) {
        // Two-phase tracking:
        // Phase 1 — defer one frame for React to flush DOM changes from onBeforeStep,
        //           then measure with CSS transitions enabled → spotlight smoothly glides
        //           from old position to the new element's initial position.
        // Phase 2 — after the CSS transition settles (~300ms), switch to per-frame RAF
        //           tracking with transitions disabled → spotlight follows the element
        //           at 60fps (e.g. profile expanding, card appearing).
        isTrackingRef.current = true;
        setIsTracking(false); // keep CSS transitions for phase 1

        trackingRAFRef.current = requestAnimationFrame(() => {
          measure(); // phase 1: CSS transition animates to initial position

          const TRANSITION_MS = 300;
          measureTimerRef.current = setTimeout(() => {
            // phase 2: per-frame tracking without transitions
            setIsTracking(true);
            const remaining = Math.max(0, track - TRANSITION_MS);
            const endTime = performance.now() + remaining;
            const loop = () => {
              measure();
              if (performance.now() < endTime) {
                trackingRAFRef.current = requestAnimationFrame(loop);
              } else {
                isTrackingRef.current = false;
                setIsTracking(false);
              }
            };
            loop();
          }, TRANSITION_MS);
        });
      } else if (wasTracking) {
        // Exiting tracking: re-enable transitions (keep old rect for one frame),
        // then measure on next frame so CSS transition fires.
        isTrackingRef.current = false;
        setIsTracking(false);
        trackingRAFRef.current = requestAnimationFrame(() => measure());
      } else {
        measure();
      }
    };

    if (delay > 0) {
      measureTimerRef.current = setTimeout(doMeasure, delay);
    } else {
      doMeasure();
    }

    const raf = requestAnimationFrame(() => setVisible(true));
    window.addEventListener('resize', measure);
    return () => {
      clearTimeout(measureTimerRef.current);
      cancelAnimationFrame(trackingRAFRef.current);
      isTrackingRef.current = false;
      window.removeEventListener('resize', measure);
      cancelAnimationFrame(raf);
    };
  }, [currentStep, measure, onBeforeStep, step?.delay]);

  // Track tooltip height so positioning always uses top+left (never bottom/transform)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useLayoutEffect(() => {
    if (tooltipRef.current) {
      const h = tooltipRef.current.offsetHeight;
      setTooltipH(prev => prev !== h ? h : prev);
    }
  });

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

  const _handleDismiss = useCallback(() => {
    (onDismiss || onComplete)();
  }, [onDismiss, onComplete]);

  if (rects === null) return (
    <div className="fixed inset-0 z-[200] bg-black/50 pointer-events-auto" />
  );

  const isLast = currentStep === steps.length - 1;
  const isFirst = currentStep === 0;

  // Tooltip position — always use top+left in pixels (never bottom/transform)
  // so that CSS transition-all can animate smoothly between any two steps.
  const tooltipStyle = {};
  const gap = 16;
  const tooltipWidth = 340;

  // If step.tooltipAnchor is set, use that element's rect for positioning
  let anchorRect = rect;
  if (step.tooltipAnchor && hasSpotlight) {
    const anchorEl = document.querySelector(`[data-tutorial="${step.tooltipAnchor}"]`);
    if (anchorEl) {
      const ar = anchorEl.getBoundingClientRect();
      const pad = step.padding ?? 12;
      anchorRect = { top: ar.top - pad, left: ar.left - pad, width: ar.width + pad * 2, height: ar.height + pad * 2 };
    }
  }

  if (!hasSpotlight) {
    // No spotlight: center the tooltip using pixel values (not transform)
    tooltipStyle.top  = Math.max(16, (window.innerHeight - tooltipH) / 2);
    tooltipStyle.left = Math.max(16, (window.innerWidth - Math.min(420, window.innerWidth - 32)) / 2);
    tooltipStyle.width = Math.min(420, window.innerWidth - 32);
  } else if (step.position === 'right') {
    // Place tooltip to the right of the spotlight
    tooltipStyle.top = Math.min(anchorRect.top, window.innerHeight - tooltipH - 16);
    let tLeft = anchorRect.left + anchorRect.width + gap;
    if (tLeft + tooltipWidth > window.innerWidth - 16) {
      tLeft = anchorRect.left - tooltipWidth - gap;
    }
    tooltipStyle.left = Math.max(16, tLeft);
    tooltipStyle.width = tooltipWidth;
  } else if (step.position === 'left') {
    // Place tooltip to the left of the spotlight
    tooltipStyle.top = Math.min(anchorRect.top, window.innerHeight - tooltipH - 16);
    let tLeft = anchorRect.left - tooltipWidth - gap;
    if (tLeft < 16) {
      tLeft = anchorRect.left + anchorRect.width + gap;
    }
    tooltipStyle.left = Math.max(16, tLeft);
    tooltipStyle.width = tooltipWidth;
  } else if (step.position === 'below') {
    // Force tooltip below the anchor element regardless of available space
    tooltipStyle.top = anchorRect.top + anchorRect.height + gap;
    let tooltipLeft = anchorRect.left + anchorRect.width / 2 - tooltipWidth / 2;
    tooltipLeft = Math.max(16, Math.min(tooltipLeft, window.innerWidth - tooltipWidth - 16));
    tooltipStyle.left = tooltipLeft;
    tooltipStyle.width = tooltipWidth;
  } else {
    // Auto: below if room, otherwise above — always use `top` (not `bottom`)
    const spaceBelow = window.innerHeight - (anchorRect.top + anchorRect.height) - gap;
    const fitsBelow  = spaceBelow >= tooltipH + 8;
    tooltipStyle.top = fitsBelow
      ? anchorRect.top + anchorRect.height + gap
      : Math.max(16, anchorRect.top - gap - tooltipH);

    let tooltipLeft = anchorRect.left + anchorRect.width / 2 - tooltipWidth / 2;
    tooltipLeft = Math.max(16, Math.min(tooltipLeft, window.innerWidth - tooltipWidth - 16));
    tooltipStyle.left = tooltipLeft;
    tooltipStyle.width = tooltipWidth;
  }

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-[200] transition-opacity duration-300"
      style={{ opacity: visible ? 1 : 0 }}
    >
      {/* SVG overlay with spotlight cutout(s) */}
      <svg className="absolute inset-0 w-full h-full" style={{ pointerEvents: 'none' }}>
        <defs>
          <mask id={maskId}>
            <rect width="100%" height="100%" fill="white" />
            {rects.map((r, i) => (
              <rect
                key={i}
                x={r.left}
                y={r.top}
                width={r.width}
                height={r.height}
                rx={step.borderRadius ?? 16}
                fill="black"
                style={isTracking ? { transition: 'none' } : { transition: 'all 300ms cubic-bezier(0.4, 0, 0.2, 1)' }}
              />
            ))}
          </mask>
        </defs>
        <rect
          width="100%"
          height="100%"
          fill="rgba(0,0,0,0.7)"
          mask={`url(#${maskId})`}
          style={{ pointerEvents: 'auto' }}
        />
      </svg>

      {/* Spotlight border rings */}
      {rects.map((r, i) => (
        <div
          key={i}
          className="absolute border-2 border-blue-400/50 pointer-events-none transition-all duration-300"
          style={{
            top: r.top,
            left: r.left,
            width: r.width,
            height: r.height,
            borderRadius: step.borderRadius ?? 16,
            boxShadow: '0 0 0 4px rgba(96,165,250,0.15)',
            ...(isTracking ? { transitionDuration: '0ms' } : {}),
          }}
        />
      ))}

      {/* Tooltip card */}
      <div
        ref={tooltipRef}
        className="absolute bg-surface-2 border border-white/[0.12] rounded-2xl p-5 shadow-2xl transition-all duration-300"
        style={{
          ...tooltipStyle,
          ...(isTracking ? { transitionDuration: '0ms' } : {}),
        }}
      >
        {/* Step counter */}
        <div className="flex items-center justify-between mb-2">
          <span className="text-[11px] font-medium text-zinc-500 uppercase tracking-wider">
            {currentStep + 1} / {steps.length}
          </span>
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
