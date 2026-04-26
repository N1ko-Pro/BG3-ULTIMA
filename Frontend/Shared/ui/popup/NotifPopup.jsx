import React, { useEffect, useRef } from 'react';
import { CheckCircle2, Info, AlertTriangle, XCircle, X } from 'lucide-react';

const VARIANTS = {
  success: {
    icon: CheckCircle2,
    iconColor: 'text-emerald-400',
    radial: 'radial-gradient(ellipse at right top, rgba(16,118,102,0.55) 0%, rgba(15,15,18,0.97) 55%, rgba(15,15,18,0.97) 100%)',
    border: 'border-emerald-500/25',
    accent: 'from-transparent via-emerald-400/30 to-transparent',
    timerColor: 'bg-emerald-400/60',
    glow: 'rgba(16,185,129,0.12)',
  },
  info: {
    icon: Info,
    iconColor: 'text-blue-400',
    radial: 'radial-gradient(ellipse at right top, rgba(30,80,200,0.50) 0%, rgba(15,15,18,0.97) 55%, rgba(15,15,18,0.97) 100%)',
    border: 'border-blue-500/25',
    accent: 'from-transparent via-blue-400/30 to-transparent',
    timerColor: 'bg-blue-400/60',
    glow: 'rgba(59,130,246,0.12)',
  },
  warning: {
    icon: AlertTriangle,
    iconColor: 'text-amber-400',
    radial: 'radial-gradient(ellipse at right top, rgba(160,100,10,0.50) 0%, rgba(15,15,18,0.97) 55%, rgba(15,15,18,0.97) 100%)',
    border: 'border-amber-500/25',
    accent: 'from-transparent via-amber-400/30 to-transparent',
    timerColor: 'bg-amber-400/60',
    glow: 'rgba(245,158,11,0.12)',
  },
  error: {
    icon: XCircle,
    iconColor: 'text-red-400',
    radial: 'radial-gradient(ellipse at right top, rgba(160,50,35,0.55) 0%, rgba(15,15,18,0.97) 55%, rgba(15,15,18,0.97) 100%)',
    border: 'border-red-500/25',
    accent: 'from-transparent via-red-400/30 to-transparent',
    timerColor: 'bg-red-400/60',
    glow: 'rgba(239,68,68,0.12)',
  },
};

const DEFAULT_VARIANT = VARIANTS.info;

export default function NotifPopup({ notification, onRemove }) {
  const v = VARIANTS[notification.type] || DEFAULT_VARIANT;
  const Icon = v.icon;
  const duration = notification.duration;

  // Timer bar: animate width from 100% → 0% over `duration` ms
  const timerRef = useRef(null);
  useEffect(() => {
    if (!duration || !timerRef.current) return;
    timerRef.current.style.transition = 'none';
    timerRef.current.style.width = '100%';
    // Force reflow before starting animation
    void timerRef.current.offsetWidth;
    timerRef.current.style.transition = `width ${duration}ms linear`;
    timerRef.current.style.width = '0%';
  }, [duration]);

  const isExiting = notification.exiting;

  return (
    <div
      className={`
        isolate group/card relative w-[340px] rounded-2xl border ${v.border}
        pointer-events-auto overflow-hidden backdrop-blur-2xl
        opacity-95 hover:opacity-100
        transition-[opacity,transform,filter]
      `}
      style={{
        background: v.radial,
        boxShadow: `0 1px 1px ${v.glow}, 0 20px 56px rgba(0,0,0,0.72), inset 0 1px 0 rgba(255,255,255,0.06)`,
        // Enter animation
        animation: isExiting
          ? 'notif-exit 0.38s cubic-bezier(0.4,0,1,1) forwards'
          : 'notif-enter 0.48s cubic-bezier(0.22,1,0.36,1) forwards',
      }}
    >
      {/* Top accent line */}
      <div className={`absolute inset-x-0 top-0 h-[1px] bg-gradient-to-r ${v.accent} pointer-events-none`} />

      {/* Grain overlay */}
      <div
        className="absolute inset-0 pointer-events-none opacity-[0.025]"
        style={{
          backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 200 200\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'n\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.9\' numOctaves=\'4\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23n)\'/%3E%3C/svg%3E")',
          backgroundSize: '120px',
        }}
      />

      {/* Close button — top-right */}
      <div className="absolute top-0 left-0 right-0 flex justify-end px-3 pt-3 z-10">
        <button
          onClick={() => onRemove(notification.id)}
          className="
            group/close relative p-1.5 rounded-lg overflow-hidden
            transition-colors duration-200
            hover:bg-white/[0.08]
          "
        >
          {/* Glow ring on hover */}
          <span className="absolute inset-0 rounded-lg opacity-0 group-hover/close:opacity-100 transition-opacity duration-200 ring-1 ring-white/20" />
          <X className="relative w-[13px] h-[13px] text-zinc-600 group-hover/close:text-zinc-100 transition-colors duration-200" />
        </button>
      </div>

      {/* Body */}
      <div className="relative flex items-start gap-3.5 pt-4 pb-3 px-4">
        <Icon className={`mt-0.5 w-[22px] h-[22px] shrink-0 ${v.iconColor}`} />
        <div className="flex-1 min-w-0 pr-5">
          {notification.title && (
            <h4 className="text-[13px] font-semibold text-white leading-snug tracking-[0.01em]">
              {notification.title}
            </h4>
          )}
          {notification.message && (
            <p className="text-[11.5px] text-zinc-400 mt-1 leading-relaxed">
              {notification.message}
            </p>
          )}
        </div>
      </div>

      {/* Timer bar — bottom edge, only when duration is set */}
      {duration && (
        <div className="relative h-[2px] w-full bg-white/[0.04]">
          <div
            ref={timerRef}
            className={`absolute left-0 top-0 h-full ${v.timerColor} rounded-full`}
            style={{ width: '100%' }}
          />
        </div>
      )}

      <style>{`
        @keyframes notif-enter {
          from { opacity: 0; transform: translateX(24px) scale(0.96); filter: blur(2px); }
          to   { opacity: 1; transform: translateX(0)   scale(1);    filter: blur(0);   }
        }
        @keyframes notif-exit {
          from { opacity: 1; transform: translateX(0)   scale(1);    filter: blur(0);   max-height: 200px; margin-bottom: 0; }
          to   { opacity: 0; transform: translateX(28px) scale(0.94); filter: blur(3px); max-height: 0;     margin-bottom: -12px; }
        }
      `}</style>
    </div>
  );
}
