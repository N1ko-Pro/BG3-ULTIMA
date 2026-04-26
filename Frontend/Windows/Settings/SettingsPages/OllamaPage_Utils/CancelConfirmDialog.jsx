import React from 'react';
import { XCircle } from 'lucide-react';

export function CancelConfirmDialog({ onConfirm, onAbort, isInstallingPhase }) {
  return (
    <div className="w-full rounded-xl border border-amber-500/25 bg-amber-500/[0.06] p-4 space-y-3 animate-[fadeIn_150ms_ease-out]">
      <div className="flex items-start gap-2.5">
        <XCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
        <div>
          <p className="text-xs font-semibold text-amber-200 mb-1">Отменить установку?</p>
          <p className="text-[11px] text-amber-200/60 leading-relaxed">
            {isInstallingPhase
              ? 'Процесс установки будет принудительно завершён, а установленные файлы — удалены.'
              : 'Загрузка будет прервана, а временные файлы — удалены.'}
          </p>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <button
          onClick={onConfirm}
          className="flex-1 h-8 rounded-lg border border-red-500/25 bg-red-500/[0.08] text-[12px] font-semibold text-red-300 hover:bg-red-500/[0.15] hover:border-red-400/35 transition-all duration-150 active:scale-[0.97]"
        >
          Да, прервать
        </button>
        <button
          onClick={onAbort}
          className="flex-1 h-8 rounded-lg border border-white/[0.06] bg-white/[0.03] text-[12px] font-semibold text-zinc-400 hover:bg-white/[0.06] hover:text-zinc-200 transition-all duration-150 active:scale-[0.97]"
        >
          Продолжить
        </button>
      </div>
    </div>
  );
}
