import React, { useState, useEffect, useRef, useSyncExternalStore, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { Bell, CheckCircle2, Info, AlertTriangle, XCircle, Trash2, CheckCheck, X } from 'lucide-react';
import { notificationStore } from './notificationCore_utils/notificationStore';

// ── Variant styling (matches NotifPopup) ────────────────────────────────────

const VARIANTS = {
  success: { icon: CheckCircle2, iconColor: 'text-emerald-400', dot: 'bg-emerald-400' },
  info:    { icon: Info,         iconColor: 'text-blue-400',    dot: 'bg-blue-400' },
  warning: { icon: AlertTriangle, iconColor: 'text-amber-400',  dot: 'bg-amber-400' },
  error:   { icon: XCircle,      iconColor: 'text-red-400',     dot: 'bg-red-400' },
};

// ── Time formatting ─────────────────────────────────────────────────────────

function timeAgo(ts) {
  const diff = Math.max(0, Math.floor((Date.now() - ts) / 1000));
  if (diff < 60) return 'только что';
  if (diff < 3600) return `${Math.floor(diff / 60)} мин. назад`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} ч. назад`;
  return `${Math.floor(diff / 86400)} д. назад`;
}

// ── Single notification row ─────────────────────────────────────────────────

function NotificationRow({ n, onRemove }) {
  const v = VARIANTS[n.type] || VARIANTS.info;
  const Icon = v.icon;

  return (
    <div className={`group relative flex items-start gap-3 px-4 py-3 transition-colors duration-150 hover:bg-white/[0.03] ${!n.read ? 'bg-white/[0.02]' : ''}`}>
      {/* Unread dot */}
      {!n.read && (
        <div className={`absolute left-1.5 top-1/2 -translate-y-1/2 w-1 h-1 rounded-full ${v.dot}`} />
      )}

      <Icon className={`mt-0.5 w-4 h-4 shrink-0 ${v.iconColor}`} />
      <div className="flex-1 min-w-0">
        {n.title && (
          <p className="text-[12px] font-semibold text-zinc-200 leading-snug truncate">{n.title}</p>
        )}
        {n.message && (
          <p className="text-[12px] text-zinc-500 leading-relaxed mt-0.5 line-clamp-2">{n.message}</p>
        )}
        <p className="text-[11px] text-zinc-600 mt-1">{timeAgo(n.timestamp)}</p>
      </div>

      {/* Remove button */}
      <button
        onClick={(e) => { e.stopPropagation(); onRemove(n.id); }}
        className="opacity-0 group-hover:opacity-100 p-1 rounded-md hover:bg-white/[0.06] text-zinc-600 hover:text-zinc-300 transition-all duration-150 shrink-0"
      >
        <X className="w-3 h-3" />
      </button>
    </div>
  );
}

// ── Main NotificationCenter ─────────────────────────────────────────────────

export default function NotificationCenter() {
  const subscribe = useCallback((cb) => notificationStore.subscribe(cb), []);
  const getSnapshot = useCallback(() => notificationStore.getAll(), []);
  const notifications = useSyncExternalStore(subscribe, getSnapshot);
  const unreadCount = notifications.filter((n) => !n.read).length;

  const [isOpen, setIsOpen] = useState(false);
  const [bellRect, setBellRect] = useState(null);
  const bellRef = useRef(null);
  const panelRef = useRef(null);

  // Capture bell position when opening
  useEffect(() => {
    if (isOpen && bellRef.current) {
      setBellRect(bellRef.current.getBoundingClientRect());
    }
  }, [isOpen]);

  // Close on outside click
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e) => {
      if (
        bellRef.current && !bellRef.current.contains(e.target) &&
        panelRef.current && !panelRef.current.contains(e.target)
      ) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [isOpen]);

  return (
    <>
      <button
        ref={bellRef}
        onClick={() => setIsOpen((v) => !v)}
        title="Уведомления"
        data-tutorial="titlebar-notifications"
        className={`group relative flex items-center justify-center w-6 h-6 rounded-md border transition-all duration-200 active:scale-[0.95] ${
          isOpen
            ? 'border-white/[0.16] bg-white/[0.06]'
            : 'border-white/[0.06] bg-transparent hover:border-white/[0.14] hover:bg-white/[0.04]'
        }`}
        style={{ WebkitAppRegion: 'no-drag' }}
      >
        <Bell className={`w-3.5 h-3.5 transition-colors duration-200 ${isOpen ? 'text-zinc-300' : 'text-zinc-500 group-hover:text-zinc-300'}`} />

        {/* Unread badge */}
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 flex items-center justify-center min-w-[14px] h-[14px] px-0.5 rounded-full bg-red-500 text-white text-[8px] font-bold leading-none shadow-[0_0_8px_rgba(239,68,68,0.4)]">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && bellRect && createPortal(
        <div
          ref={panelRef}
          className="fixed z-[300] animate-[fadeIn_150ms_ease-out]"
          style={{ top: bellRect.bottom + 6, right: window.innerWidth - bellRect.right }}
        >
          <div className="w-80 max-h-[420px] rounded-xl border border-white/[0.1] bg-surface-2/98 backdrop-blur-2xl shadow-[0_12px_48px_rgba(0,0,0,0.6)] overflow-hidden flex flex-col">
            {/* Header */}
            <div className="shrink-0 flex items-center justify-between px-4 py-3 border-b border-white/[0.06]">
              <h3 className="text-[13px] font-semibold text-zinc-200">Уведомления</h3>
              <div className="flex items-center gap-1">
                {unreadCount > 0 && (
                  <button
                    onClick={() => notificationStore.markAllRead()}
                    title="Отметить все как прочитанные"
                    className="p-1.5 rounded-md text-zinc-500 hover:text-zinc-300 hover:bg-white/[0.06] transition-all duration-150"
                  >
                    <CheckCheck className="w-3.5 h-3.5" />
                  </button>
                )}
                {notifications.length > 0 && (
                  <button
                    onClick={() => notificationStore.clear()}
                    title="Очистить все"
                    className="p-1.5 rounded-md text-zinc-500 hover:text-red-400 hover:bg-red-400/[0.06] transition-all duration-150"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>

            {/* List */}
            <div className="flex-1 overflow-y-auto overflow-x-hidden">
              {notifications.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <Bell className="w-6 h-6 text-zinc-700 mb-3" />
                  <p className="text-[13px] text-zinc-600">Нет уведомлений</p>
                </div>
              ) : (
                <div className="divide-y divide-white/[0.04]">
                  {notifications.map((n) => (
                    <NotificationRow
                      key={n.id}
                      n={n}
                      onRemove={(id) => notificationStore.remove(id)}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>,
        document.body,
      )}

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(-4px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </>
  );
}
