import React from 'react';
import { Archive, Check, Layers, Sparkles } from 'lucide-react';
import { createPortal } from 'react-dom';

export default function PackModal({ isOpen, onClose, onPack }) {
  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4" role="dialog" aria-modal="true">
      {/* Overlay */}
      <div
        className="absolute inset-0 animate-[modalOverlayIn_0.2s_ease-out_both]"
        style={{ background: 'rgba(0,0,0,0.82)', backdropFilter: 'blur(14px)' }}
        onClick={onClose}
      />

      {/* Panel */}
      <div className="relative w-full max-w-sm animate-[modalPanelIn_0.25s_cubic-bezier(0.16,1,0.3,1)_both]">
        {/* Glass surface */}
        <div className="absolute inset-0 bg-surface-2/98 backdrop-blur-2xl border border-white/[0.08] rounded-2xl shadow-[0_32px_80px_rgba(0,0,0,0.6)]" />
        {/* Top shimmer */}
        <div className="absolute inset-x-0 top-0 h-[1px] bg-gradient-to-r from-transparent via-white/[0.15] to-transparent rounded-t-2xl" />
        {/* Subtle glow */}
        <div className="absolute inset-0 rounded-2xl overflow-hidden pointer-events-none">
          <div className="absolute -top-8 left-1/2 -translate-x-1/2 w-48 h-24 bg-sky-500/[0.07] blur-3xl rounded-full" />
        </div>

        <div className="relative z-10 p-6 flex flex-col gap-5">
          {/* Header */}
          <div className="flex items-start gap-4">
            <div className="relative shrink-0">
              <div className="absolute inset-0 bg-sky-500/20 blur-xl rounded-2xl" />
              <div className="relative w-12 h-12 rounded-2xl bg-surface-3 border border-sky-500/25 flex items-center justify-center shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]">
                <Archive className="w-5 h-5 text-sky-300" />
              </div>
            </div>
            <div className="flex-1 pt-0.5">
              <h2 className="text-[17px] font-semibold text-zinc-100 tracking-tight">Готово к упаковке</h2>
              <p className="text-[13px] text-zinc-500 mt-0.5 leading-snug">Переводы будут сохранены и собраны в <span className="text-zinc-400 font-medium">.pak</span> файл</p>
            </div>
            <button
              onClick={onClose}
              className="shrink-0 w-7 h-7 flex items-center justify-center rounded-full text-zinc-600 hover:text-zinc-300 hover:bg-white/[0.07] transition-all duration-150"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Divider */}
          <div className="h-px bg-white/[0.06]" />

          {/* Steps */}
          <div className="space-y-2">
            <PackStep icon={Check} color="text-emerald-400" bg="bg-emerald-500/[0.08]" border="border-emerald-500/15"
              label="Сохранение переводов" sub="Все изменения фиксируются в проекте" />
            <PackStep icon={Layers} color="text-sky-400" bg="bg-sky-500/[0.08]" border="border-sky-500/15"
              label="Сборка .pak архива" sub="Формирование файла для BG3" />
            <PackStep icon={Sparkles} color="text-violet-400" bg="bg-violet-500/[0.08]" border="border-violet-500/15"
              label="Готово к установке" sub="Результат появится в папке мода" />
          </div>

          {/* Footer */}
          <div className="flex gap-2.5 pt-1">
            <button
              onClick={onClose}
              className="flex-1 h-10 rounded-xl border border-white/[0.07] bg-surface-3 hover:bg-surface-4 text-zinc-400 hover:text-zinc-200 text-sm font-medium transition-all duration-200"
            >
              Отмена
            </button>
            <button
              onClick={onPack}
              className="flex-[2] h-10 rounded-xl border border-sky-500/30 bg-sky-500/[0.1] hover:bg-sky-500/[0.18] hover:border-sky-400/40 text-sky-200 hover:text-sky-100 text-sm font-semibold transition-all duration-200 hover:shadow-[0_0_20px_rgba(14,165,233,0.15)] active:scale-[0.98] flex items-center justify-center gap-2"
            >
              <Archive className="w-4 h-4" />
              Упаковать мод
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}

function PackStep({ icon: Icon, color, bg, border, label, sub }) {
  return (
    <div className={`flex items-center gap-3 rounded-xl border ${border} ${bg} px-3.5 py-2.5`}>
      <div className={`w-7 h-7 rounded-lg bg-surface-3/80 flex items-center justify-center shrink-0`}>
        <Icon className={`w-3.5 h-3.5 ${color}`} />
      </div>
      <div>
        <p className="text-[13px] font-medium text-zinc-200">{label}</p>
        <p className="text-[11px] text-zinc-500 mt-0.5">{sub}</p>
      </div>
    </div>
  );
}
