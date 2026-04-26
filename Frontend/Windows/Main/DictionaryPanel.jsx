import React, { useState, useEffect, useCallback, useRef } from 'react';
import { createPortal } from 'react-dom';
import { BookOpen, Search, FileUp, FileDown, RotateCcw, HelpCircle, X } from 'lucide-react';
import { EntryRow, AddRow } from './DictionaryPanel_Utils/DictionaryPanelButtons';
import { CategorySidebar, LetterFilter } from './DictionaryPanel_Utils/DictionaryCategories';
import { CATEGORIES } from './DictionaryPanel_Utils/DictionaryCategories.constants';
import { useLocale } from '../../Locales';

export default function DictionaryPanel({ isOpen }) {
  const t = useLocale();
  const [entries, setEntries] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [resetConfirm, setResetConfirm] = useState(false);
  const [resetTooltipPos, setResetTooltipPos] = useState(null);
  const resetTooltipAnchorRef = useRef(null);
  const [category, setCategory] = useState('all');
  const [letter, setLetter] = useState(null);
  const [letterLang, setLetterLang] = useState('en');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await window.electronAPI.dictionaryGetAll();
      if (res?.success) setEntries(res.data);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isOpen) load();
  }, [isOpen, load]);

  const handleAdd = async (source, target, tag) => {
    const res = await window.electronAPI.dictionaryAdd(source, target, tag);
    if (res?.success) setEntries((prev) => [...prev, res.data]);
  };

  const handleUpdate = async (id, source, target, tag) => {
    const res = await window.electronAPI.dictionaryUpdate(id, source, target, tag);
    if (res?.success) setEntries((prev) => prev.map((e) => (e.id === id ? res.data : e)));
  };

  const handleDelete = async (id) => {
    const res = await window.electronAPI.dictionaryDelete(id);
    if (res?.success) setEntries((prev) => prev.filter((e) => e.id !== id));
  };

  const handleExport = async () => {
    const res = await window.electronAPI.dictionaryExport();
    if (!res?.success) return;
  };

  const handleImport = async () => {
    const res = await window.electronAPI.dictionaryImport();
    if (res?.success) setEntries(res.data);
  };

  const handleReset = async () => {
    if (!resetConfirm) {
      setResetConfirm(true);
      return;
    }
    setResetConfirm(false);
    const res = await window.electronAPI.dictionaryReset();
    if (res?.success) setEntries(res.data);
  };

  useEffect(() => {
    if (!resetConfirm) return;
    const t = setTimeout(() => setResetConfirm(false), 3000);
    return () => clearTimeout(t);
  }, [resetConfirm]);

  const showResetTooltip = useCallback(() => {
    if (!resetTooltipAnchorRef.current) return;
    const rect = resetTooltipAnchorRef.current.getBoundingClientRect();
    setResetTooltipPos({ top: rect.bottom + 8, left: rect.left + rect.width / 2 });
  }, []);
  const hideResetTooltip = useCallback(() => setResetTooltipPos(null), []);

  const filtered = entries.filter((e) => {
    if (category !== 'all' && (e.tag || 'mechanics') !== category) return false;
    if (letter) {
      const text = letterLang === 'ru' ? e.target : e.source;
      if (!text.toUpperCase().startsWith(letter)) return false;
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      if (!e.source.toLowerCase().includes(q) && !e.target.toLowerCase().includes(q)) return false;
    }
    return true;
  });

  const activeCat = CATEGORIES.find((c) => c.id === category);

  const handleCategorySelect = (newCat) => {
    if (letter) {
      const hasLetter = entries.some(
        (e) =>
          (newCat === 'all' || (e.tag || 'mechanics') === newCat) &&
          (letterLang === 'ru' ? e.target : e.source).toUpperCase().startsWith(letter)
      );
      if (!hasLetter) setLetter(null);
    }
    setCategory(newCat);
  };

  return (
    <div className="flex flex-col h-full min-h-0 overflow-hidden" data-tutorial="dict-panel">
      {/* Header — full width, spans category sidebar + content */}
      <div className="shrink-0 px-5 pt-5 pb-4 border-b border-white/[0.06]" data-tutorial="dict-header">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-9 h-9 rounded-xl bg-surface-3 border border-white/[0.1] flex items-center justify-center shrink-0 shadow-[0_0_20px_rgba(255,255,255,0.03)]">
            <BookOpen className="w-4.5 h-4.5 text-zinc-400" />
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-[14px] font-semibold text-zinc-100 leading-none tracking-tight">{t.dictionary.title}</h2>
            <p className="text-[11px] text-zinc-500 mt-1">
              {filtered.length === entries.length
                ? <>{t.dictionary.terms(entries.length)}</>
                : <>{filtered.length} <span className="text-zinc-600">{t.dictionary.of}</span> {entries.length}</>
              }
              {category !== 'all' && (
                <span className={`ml-1.5 ${activeCat?.color}`}>• {activeCat?.label}</span>
              )}
              {letter && (
                <span className="ml-1.5 text-zinc-400">• {letter}</span>
              )}
            </p>
          </div>
        </div>

        {/* Import / Export / Reset strip */}
        <div className="flex rounded-xl overflow-hidden border border-white/[0.07] mb-4" data-tutorial="dict-actions">
          <button
            onClick={handleImport}
            className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-surface-2 hover:bg-surface-3 text-zinc-500 hover:text-zinc-200 transition-all duration-150 group/btn"
          >
            <FileUp className="w-3 h-3 text-emerald-400/50 group-hover/btn:text-emerald-300 transition-colors duration-150" />
            <span className="text-[10px] font-medium tracking-wide uppercase">{t.dictionary.import}</span>
          </button>
          <div className="w-px bg-white/[0.07] shrink-0" />
          <button
            onClick={handleExport}
            className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-surface-2 hover:bg-surface-3 text-zinc-500 hover:text-zinc-200 transition-all duration-150 group/btn"
          >
            <FileDown className="w-3 h-3 text-sky-400/50 group-hover/btn:text-sky-300 transition-colors duration-150" />
            <span className="text-[10px] font-medium tracking-wide uppercase">{t.dictionary.export}</span>
          </button>
          <div className="w-px bg-white/[0.07] shrink-0" />
          <button
            onClick={handleReset}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 transition-all duration-200 group/rst ${
              resetConfirm
                ? 'bg-amber-500/10 text-amber-300 border-amber-400/20'
                : 'bg-surface-2 hover:bg-surface-3 text-zinc-500 hover:text-amber-300'
            }`}
          >
            <RotateCcw
              className={`w-3 h-3 transition-colors duration-200 ${
                resetConfirm ? 'text-amber-400' : 'text-amber-400/40 group-hover/rst:text-amber-400'
              }`}
            />
            <span className="text-[10px] font-medium tracking-wide uppercase">
              {resetConfirm ? t.dictionary.resetConfirm : t.dictionary.reset}
            </span>
            <div className="relative inline-flex">
              <div
                ref={resetTooltipAnchorRef}
                onMouseEnter={showResetTooltip}
                onMouseLeave={hideResetTooltip}
                className="flex items-center"
              >
                <HelpCircle className="w-3 h-3 text-zinc-600 hover:text-zinc-400 transition-colors duration-200" aria-hidden="true" />
              </div>
              {resetTooltipPos && createPortal(
                <div
                  className="pointer-events-none fixed z-50 w-56 rounded-xl border border-white/[0.12] bg-surface-2/98 backdrop-blur-2xl text-orange-200/80 text-[12px] p-3 shadow-[0_12px_40px_rgba(0,0,0,0.5)] text-center leading-relaxed whitespace-normal break-words"
                  style={{ top: resetTooltipPos.top, left: resetTooltipPos.left, transform: 'translateX(-50%)' }}
                >
                  {t.dictionary.resetTooltip}
                </div>,
                document.body
              )}
            </div>
          </button>
        </div>

        {/* Search */}
        <div className="relative group" data-tutorial="dict-search">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-600 group-focus-within:text-white/50 pointer-events-none transition-colors duration-200" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t.dictionary.searchPlaceholder}
            className="w-full bg-surface-2 border border-white/[0.07] [&:not(:focus)]:hover:border-white/[0.12] focus:border-white/[0.4] rounded-xl py-2.5 pl-9 pr-8 text-[12px] text-zinc-200 placeholder-zinc-600 outline-none focus:ring-2 focus:ring-white/[0.08] focus:shadow-[0_0_0_3px_rgba(255,255,255,0.03)] transition-[border-color,box-shadow] duration-200"
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 flex items-center justify-center rounded text-zinc-600 hover:text-zinc-300 transition-colors duration-150"
            >
              <X className="w-3 h-3" />
            </button>
          )}
        </div>
      </div>

      {/* Body — category sidebar + content side by side */}
      <div className="flex flex-1 min-h-0 overflow-hidden" data-tutorial="dict-body">
        {/* Category sidebar */}
        <div data-tutorial="dict-categories" className="shrink-0">
          <CategorySidebar active={category} onSelect={handleCategorySelect} />
        </div>

        {/* Main content */}
        <div className="flex flex-col flex-1 min-h-0 overflow-hidden">
          {/* Letter filter */}
          <div data-tutorial="dict-letters">
          <LetterFilter
            active={letter}
            onSelect={setLetter}
            entries={entries}
            category={category}
            lang={letterLang}
            onLangChange={(l) => { setLetterLang(l); setLetter(null); }}
          />
          </div>

          {/* Column headers */}
          <div className="shrink-0 mx-3 mt-2">
            <div className="grid grid-cols-[minmax(0,2fr)_1px_minmax(0,3fr)_56px] px-4 py-2 rounded-lg border border-white/[0.06] bg-surface-2/60">
              <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">{t.dictionary.colOriginal}</span>
              <div className="w-px bg-white/[0.06]" />
              <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest pl-3">{t.dictionary.colTranslation}</span>
              <div />
            </div>
          </div>

          {/* Entries list */}
          <div className="flex-1 min-h-0 overflow-y-auto px-3 py-2 space-y-px" data-tutorial="dict-table">
            {loading ? (
              <div className="flex items-center justify-center py-10">
                <div className="w-6 h-6 border-2 border-white/10 border-t-white/40 rounded-full animate-spin" />
              </div>
            ) : filtered.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 gap-2">
                <div className="w-10 h-10 rounded-xl bg-surface-2 border border-white/[0.06] flex items-center justify-center">
                  <BookOpen className="w-5 h-5 text-zinc-600" />
                </div>
                <span className="text-zinc-600 text-[13px]">
                  {search || letter || category !== 'all' ? t.dictionary.noMatches : t.dictionary.empty}
                </span>
              </div>
            ) : (
              filtered.map((entry) => (
                <EntryRow key={entry.id} entry={entry} onUpdate={handleUpdate} onDelete={handleDelete} />
              ))
            )}
          </div>

          {/* Add new row */}
          <div className="shrink-0 px-3 pb-3 pt-2 border-t border-white/[0.06]" data-tutorial="dict-add">
            <AddRow onAdd={handleAdd} entries={entries} />
          </div>
        </div>
      </div>
    </div>
  );
}
