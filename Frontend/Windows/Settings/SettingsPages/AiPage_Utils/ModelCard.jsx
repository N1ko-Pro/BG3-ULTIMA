import React, { useState } from 'react';
import { CheckCircle2, ChevronDown, Download, HardDrive, Loader2, Trash2, X } from 'lucide-react';
import { TIER_CONFIG } from './tierConfig';
import { TagPill } from './TagPill';

export function ModelCard({ model, isSelected, isInstalled, isPulling, isCancellingPull, isDeleting, pullProgress, pullStatus, pullSpeedMbs, onSelect, onPull, onCancelPull, onDelete }) {
  const t = TIER_CONFIG[model.tier] || TIER_CONFIG.lite;
  const [shaking, setShaking] = useState(false);
  const [expanded, setExpanded] = useState(false);

  const handleClick = () => {
    if (isPulling || isDeleting) return;
    if (!isInstalled) {
      if (shaking) return;
      setShaking(true);
      setTimeout(() => setShaking(false), 480);
      return;
    }
    onSelect(model.id);
  };

  return (
    <div
      onClick={handleClick}
      style={{
        ...(shaking ? { animation: 'modelShake 0.48s cubic-bezier(0.36,0.07,0.19,0.97)' } : {}),
        ...(isDeleting ? { opacity: 0.5, filter: 'grayscale(0.5) blur(1px)', pointerEvents: 'none', transform: 'scale(0.98)' } : {})
      }}
      className={`group relative rounded-2xl border p-4 transition-all duration-300 overflow-hidden ${
        isSelected
          ? `${t.cardSel} ${t.glow} cursor-pointer`
          : isInstalled && !isPulling && !isDeleting
            ? `${t.card} hover:border-white/[0.12] hover:bg-white/[0.03] cursor-pointer`
            : `${t.card} cursor-default`
      }`}
    >
      {isSelected && (
        <div className={`absolute inset-x-0 top-0 h-[1px] bg-gradient-to-r from-transparent ${t.edge} to-transparent`} />
      )}

      <div className="flex items-stretch gap-3">
        {/* Radio indicator */}
        <div className="shrink-0 flex items-start pt-1">
          {isSelected ? (
            <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${t.dotText} border-current`}>
              <div className={`w-1.5 h-1.5 rounded-full ${t.dot}`} />
            </div>
          ) : (
            <div className={`w-4 h-4 rounded-full border-2 ${isInstalled ? 'border-zinc-600 group-hover:border-zinc-400' : 'border-zinc-700/60'} transition-colors`} />
          )}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className={`text-[13px] font-semibold leading-tight ${isSelected ? 'text-white' : 'text-zinc-100'}`}>
                {model.title}
              </span>
              <span className={`rounded-full border px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider ${t.badge}`}>
                {model.badge}
              </span>
            </div>

            {model.tags?.length > 0 && (
              <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
                {model.tags.map((tag) => <TagPill key={tag} label={tag} tier={model.tier} />)}
              </div>
            )}

            <div className="flex items-center gap-1 mt-1.5">
              <HardDrive className="w-3 h-3 text-zinc-500 shrink-0" />
              <span className="text-[11px] text-zinc-300 font-mono font-medium">{model.size}</span>
              {model.vram && (
                <>
                  <span className="text-zinc-600 text-[11px] mx-0.5">|</span>
                  <span className="text-[11px] text-zinc-500 font-mono">{model.vram}</span>
                </>
              )}
            </div>
          </div>

          {isPulling && (
            <div className="mt-3 space-y-1.5" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center gap-2">
                <div className="flex-1 h-1.5 rounded-full bg-white/[0.06] overflow-hidden">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-fuchsia-500 transition-all duration-300 shadow-[0_0_8px_rgba(99,102,241,0.4)]"
                    style={{ width: `${Math.max(2, pullProgress)}%` }}
                  />
                </div>
                <div className="shrink-0 flex items-center gap-2">
                  {pullProgress > 0 && (
                    <span className="text-[10px] font-bold font-mono text-zinc-100 tabular-nums">
                      {pullProgress}%
                    </span>
                  )}
                  <button
                    onClick={() => !isCancellingPull && onCancelPull?.(model.id)}
                    disabled={isCancellingPull}
                    className="shrink-0 flex items-center gap-1 rounded-lg border border-red-500/20 bg-red-500/10 px-2 py-1 text-[10px] font-semibold text-red-300 transition-all duration-200 hover:bg-red-500/20 hover:border-red-400/30 active:scale-95 disabled:opacity-50"
                  >
                    {isCancellingPull ? <Loader2 className="h-2.5 w-2.5 animate-spin" /> : <X className="h-2.5 w-2.5" />}
                    {isCancellingPull ? 'Отмена...' : 'Отменить'}
                  </button>
                </div>
              </div>
              <p className="text-[10px] text-zinc-500">
                {[
                  pullStatus || 'Подготовка...',
                  pullProgress > 0 && pullSpeedMbs > 0
                    ? (pullSpeedMbs < 1 ? `${Math.round(pullSpeedMbs * 1024)} КБ/с` : `${pullSpeedMbs.toFixed(1)} МБ/с`)
                    : null,
                ].filter(Boolean).join(' · ')}
              </p>
            </div>
          )}
        </div>

        {/* Actions side column */}
        <div className="shrink-0 flex flex-col justify-center items-end gap-2" onClick={(e) => e.stopPropagation()}>
          {isDeleting ? (
            <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-red-500/5 border border-red-500/10">
              <Loader2 className="w-3.5 h-3.5 text-red-400 animate-spin" />
              <span className="text-[10px] font-bold text-red-400 uppercase tracking-tight">Удаление...</span>
            </div>
          ) : isInstalled && !isPulling && (
            <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-emerald-500/5 border border-emerald-500/10">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-tight">Загружена</span>
            </div>
          )}
          {!isInstalled && !isPulling && !isDeleting && (
            <button
              onClick={() => onPull(model.id)}
              className="flex items-center gap-1.5 rounded-xl border border-indigo-500/20 bg-indigo-500/10 px-3.5 py-1.5 text-[11px] font-bold text-indigo-300 transition-all duration-200 hover:bg-indigo-500/20 hover:border-indigo-400/30 active:scale-95"
              style={shaking ? { animation: 'downloadHighlight 0.48s ease-in-out' } : undefined}
            >
              <Download className="h-3.5 w-3.5" />
              Скачать
            </button>
          )}
          {isInstalled && !isPulling && !isDeleting && (
            <button
              onClick={() => onDelete(model.id)}
              title="Удалить модель"
              className="group/del flex items-center justify-center h-8 w-8 rounded-xl border border-white/[0.04] bg-white/[0.02] text-zinc-500 transition-all duration-200 hover:border-red-500/30 hover:bg-red-500/10 hover:text-red-400 active:scale-90"
            >
              <Trash2 className="h-4 w-4 transition-transform duration-200 group-hover/del:scale-110" />
            </button>
          )}
        </div>
      </div>

      {/* Expandable description */}
      {model.description && (
        <>
          <div
            style={{
              display: 'grid',
              gridTemplateRows: expanded ? '1fr' : '0fr',
              transition: 'grid-template-rows 320ms cubic-bezier(0.4, 0, 0.2, 1)',
            }}
          >
            <div className="overflow-hidden">
              <p className="pt-2.5 mt-3 text-[11px] text-zinc-400 leading-relaxed border-t border-white/[0.06]">
                {model.description}
              </p>
            </div>
          </div>

          <button
            onClick={(e) => { e.stopPropagation(); setExpanded((v) => !v); }}
            className="w-full flex justify-center items-center pt-2.5 -mb-0.5 text-zinc-600 hover:text-zinc-400 transition-colors duration-200"
            aria-label={expanded ? 'Свернуть описание' : 'Развернуть описание'}
          >
            <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-300 ${expanded ? 'rotate-180' : ''}`} />
          </button>
        </>
      )}
    </div>
  );
}
