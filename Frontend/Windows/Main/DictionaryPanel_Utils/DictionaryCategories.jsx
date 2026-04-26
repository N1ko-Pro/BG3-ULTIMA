import React, { useState, useRef, useEffect } from 'react';
import {
  Layers, Cog, Sword, Shield, Sparkles,
  Skull, Users, Gem, MapPin,
} from 'lucide-react';

import { CATEGORIES, getCategoryById } from './DictionaryCategories.constants';
import { useLocale } from '../../../Locales';

/* ── Category sidebar ─────────────────────────────────────────────── */

export function CategorySidebar({ active, onSelect }) {
  const t = useLocale();
  return (
    <div className="shrink-0 w-[48px] h-full flex flex-col items-center gap-1.5 py-10 border-r border-white/[0.06] bg-surface-0/40">
      {CATEGORIES.map((cat) => {
        const Icon = cat.icon;
        const isActive = active === cat.id;
        return (
          <button
            key={cat.id}
            onClick={() => onSelect(cat.id)}
            title={t.dictionary.categories[cat.id] || cat.label}
            className={`group/cat relative w-[34px] h-[34px] flex items-center justify-center rounded-lg transition-all duration-200 ${
              isActive
                ? `${cat.activeBg} ${cat.color}`
                : `text-zinc-600 ${cat.hoverBg} hover:text-zinc-400`
            }`}
          >
            <Icon className="w-4 h-4 transition-transform duration-200 group-hover/cat:scale-[1.2]" />

            {/* Tooltip */}
            <div className="absolute left-full ml-2.5 px-2.5 py-1 rounded-lg bg-surface-4 border border-white/[0.1] text-[11px] text-zinc-200 whitespace-nowrap opacity-0 pointer-events-none group-hover/cat:opacity-100 transition-opacity duration-150 z-50 shadow-[0_4px_16px_rgba(0,0,0,0.4)]">
              {t.dictionary.categories[cat.id] || cat.label}
              <div className="absolute right-full top-1/2 -translate-y-1/2 border-4 border-transparent border-r-surface-4" />
            </div>

            {/* Active indicator line */}
            {isActive && (
              <div className={`absolute -left-[1px] top-1/2 -translate-y-1/2 w-[2px] h-3.5 rounded-r-full ${cat.accent}`} />
            )}
          </button>
        );
      })}
    </div>
  );
}

/* ── Letter filter ────────────────────────────────────────────────── */

const EN_LETTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
const RU_LETTERS = 'АБВГДЕЁЖЗИЙКЛМНОПРСТУФХЦЧШЩЪЫЬЭЮЯ'.split('');

export function LetterFilter({ active, onSelect, entries, category, lang, onLangChange }) {
  const letters = lang === 'ru' ? RU_LETTERS : EN_LETTERS;
  const [hoveredIdx, setHoveredIdx] = useState(null);

  const available = new Set();
  entries.forEach((e) => {
    if (category !== 'all' && (e.tag || 'mechanics') !== category) return;
    const text = lang === 'ru' ? e.target : e.source;
    const first = text?.[0]?.toUpperCase();
    if (first) available.add(first);
  });

  return (
    <div className="shrink-0 flex items-center gap-1 py-1.5 px-2 border-b border-white/[0.04] overflow-x-auto scrollbar-none">
      {/* EN / RU toggle */}
      <div className="flex shrink-0 rounded-[4px] overflow-hidden border border-white/[0.08] mr-1">
        {['en', 'ru'].map((l) => (
          <button
            key={l}
            onClick={() => onLangChange(l)}
            className={`px-1.5 h-[18px] text-[9px] font-bold transition-all duration-100 ${
              lang === l ? 'bg-white/[0.14] text-zinc-200' : 'text-zinc-600 hover:text-zinc-400'
            }`}
          >
            {l.toUpperCase()}
          </button>
        ))}
      </div>
      <div className="w-px h-3 bg-white/[0.08] shrink-0 mr-0.5" />
      {letters.map((l, idx) => {
        const has = available.has(l);
        const isActive = active === l;
        const dist = hoveredIdx !== null ? Math.abs(idx - hoveredIdx) : Infinity;
        const scale = dist === 0 ? 1.65 : dist === 1 ? 1.2 : dist === 2 ? 1.07 : 1;
        return (
          <button
            key={l}
            onClick={() => has ? onSelect(isActive ? null : l) : undefined}
            onMouseEnter={() => setHoveredIdx(idx)}
            onMouseLeave={() => setHoveredIdx(null)}
            style={{ transform: `scale(${scale})`, position: scale > 1 ? 'relative' : undefined, zIndex: scale > 1 ? 10 : undefined }}
            className={`w-[15px] h-[18px] flex items-center justify-center text-[9px] font-semibold rounded-[3px] transition-[transform,color,background-color] duration-100 ${
              isActive
                ? 'bg-white/[0.15] text-zinc-100'
                : has
                  ? `text-zinc-500 hover:text-zinc-200`
                  : 'text-zinc-800 cursor-default'
            }`}
          >
            {l}
          </button>
        );
      })}
    </div>
  );
}

/* ── Tag picker (inline popup) ────────────────────────────────────── */

export function TagPicker({ value, onChange }) {
  const t = useLocale();
  const [open, setOpen] = useState(false);
  const [dropUp, setDropUp] = useState(true);
  const ref = useRef(null);
  const btnRef = useRef(null);

  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleToggle = () => {
    if (!open && btnRef.current) {
      const rect = btnRef.current.getBoundingClientRect();
      setDropUp(rect.top > window.innerHeight / 2);
    }
    setOpen(!open);
  };

  const current = getCategoryById(value);
  const Icon = current.icon;

  return (
    <div ref={ref} className="relative">
      <button
        ref={btnRef}
        onClick={handleToggle}
        title={`${t.dictionary.categories.all}: ${t.dictionary.categories[current.id] || current.label}`}
        className={`w-7 h-7 flex items-center justify-center rounded-lg transition-all duration-200 ${current.color} ${current.activeBg}`}
      >
        <Icon className="w-3.5 h-3.5" />
      </button>

      {open && (
        <div className={`absolute right-0 p-1.5 rounded-xl bg-surface-2/60 backdrop-blur-2xl border border-white/[0.15] shadow-[0_8px_40px_rgba(0,0,0,0.6),inset_0_1px_0_rgba(255,255,255,0.08)] z-50 ${dropUp ? 'bottom-full mb-1.5' : 'top-full mt-1.5'}`}>
          <div className="flex gap-1">
            {CATEGORIES.filter((c) => c.id !== 'all').map((cat) => {
              const CatIcon = cat.icon;
              const isSelected = value === cat.id;
              return (
                <button
                  key={cat.id}
                  onClick={() => { onChange(cat.id); setOpen(false); }}
                  title={t.dictionary.categories[cat.id] || cat.label}
                  className={`w-7 h-7 flex items-center justify-center rounded-lg transition-all duration-150 ${
                    isSelected
                      ? `${cat.activeBg} ${cat.color}`
                      : `text-zinc-600 hover:text-zinc-400 hover:bg-white/[0.06]`
                  }`}
                >
                  <CatIcon className="w-3.5 h-3.5" />
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
