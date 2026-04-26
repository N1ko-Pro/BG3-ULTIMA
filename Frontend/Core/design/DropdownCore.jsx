import React, { useState, useRef, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { ChevronDown, Check } from 'lucide-react';

export default function DropdownCore({ value, options, onChange, className = '' }) {
  const [isOpen, setIsOpen] = useState(false);
  const [menuPos, setMenuPos] = useState({ top: 0, left: 0 });
  const triggerRef = useRef(null);

  const updatePosition = useCallback(() => {
    if (!triggerRef.current) return;
    const rect = triggerRef.current.getBoundingClientRect();
    setMenuPos({ top: rect.bottom + 6, left: rect.left });
  }, []);

  useEffect(() => {
    if (!isOpen) return;
    updatePosition();

    const handleClickOutside = (e) => {
      if (triggerRef.current && triggerRef.current.contains(e.target)) return;
      if (e.target.closest('[data-dropdown-portal]')) return;
      setIsOpen(false);
    };
    const handleScroll = () => setIsOpen(false);

    document.addEventListener('mousedown', handleClickOutside);
    window.addEventListener('scroll', handleScroll, true);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      window.removeEventListener('scroll', handleScroll, true);
    };
  }, [isOpen, updatePosition]);

  const selected = options.find((opt) => opt.id === value);

  return (
    <div className={`relative ${className}`}>
      <button
        ref={triggerRef}
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          setIsOpen((prev) => !prev);
        }}
        className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-white/[0.08] bg-surface-2 hover:bg-surface-3 hover:border-white/[0.14] transition-all duration-200 text-[12px] text-zinc-300 min-w-0 max-w-[180px]"
      >
        <span className="truncate">{selected?.title || '—'}</span>
        <ChevronDown
          className={`w-3 h-3 shrink-0 text-zinc-600 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`}
        />
      </button>

      {isOpen &&
        createPortal(
          <div
            data-dropdown-portal
            className="fixed min-w-[140px] w-max rounded-xl overflow-hidden border border-white/[0.08] shadow-[0_12px_40px_rgba(0,0,0,0.6)] z-[200] animate-[fadeIn_150ms_ease-out]"
            style={{ top: menuPos.top, left: menuPos.left }}
            onMouseDown={(e) => e.stopPropagation()}
          >
            <div className="absolute inset-0 bg-surface-2/98 backdrop-blur-2xl" />
            <div className="absolute inset-x-0 top-0 h-[1px] bg-gradient-to-r from-transparent via-white/[0.1] to-transparent" />
            <div className="relative z-10 py-1">
              {options.map((opt) => {
                const isActive = opt.id === value;
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onChange(opt.id);
                      setIsOpen(false);
                    }}
                    className={`w-full flex items-center gap-2.5 px-3 py-2 text-left transition-all duration-200 ${
                      isActive
                        ? 'bg-surface-4 text-white'
                        : 'text-zinc-400 hover:bg-surface-3 hover:text-zinc-200'
                    }`}
                  >
                    <div className="flex-1 min-w-0">
                      <span className="block text-[12px] font-medium truncate">{opt.title}</span>
                      {opt.subtitle && (
                        <span className="block text-[10px] text-zinc-600 mt-0.5 truncate">{opt.subtitle}</span>
                      )}
                    </div>
                    {isActive && <Check className="w-3 h-3 shrink-0 text-white/60" />}
                  </button>
                );
              })}
            </div>
          </div>,
          document.body
        )}
    </div>
  );
}
