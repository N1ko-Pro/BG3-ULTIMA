import React, { useState, useEffect } from 'react';
import { CheckCircle2, Loader2, X, XCircle } from 'lucide-react';

const INSTALL_PHRASES = [
  { maxSec: 10,       text: 'Подтвердите запрос прав администратора (UAC)...' },
  { maxSec: 22,       text: 'Распаковка файлов установщика...' },
  { maxSec: 36,       text: 'Установка компонентов Ollama...' },
  { maxSec: 50,       text: 'Регистрация служб и системных путей...' },
  { maxSec: 65,       text: 'Настройка переменных среды...' },
  { maxSec: 72,       text: 'Финальная настройка, почти готово...' },
  { maxSec: Infinity, text: 'Последние штрихи...' },
];

export function InstallProgress({ progress, onCancel, isCancelling }) {
  const { phase, percent = 0, message = '', speedMBps = 0 } = progress;
  const isDownloading = phase === 'downloading';
  const isInstalling  = phase === 'installing';
  const isComplete    = phase === 'complete';
  const isError       = phase === 'error';
  const canCancel     = (isDownloading || isInstalling) && !isCancelling;

  const [installSeconds, setInstallSeconds] = useState(0);
  useEffect(() => {
    if (!isInstalling || isCancelling) {
      const reset = setTimeout(() => setInstallSeconds(0), 0);
      return () => clearTimeout(reset);
    }
    const reset = setTimeout(() => setInstallSeconds(0), 0);
    const timer = setInterval(() => setInstallSeconds((s) => s + 1), 1000);
    return () => { clearTimeout(reset); clearInterval(timer); };
  }, [isInstalling, isCancelling]);

  const installPhrase = INSTALL_PHRASES.find((p) => installSeconds < p.maxSec)?.text ?? '';

  return (
    <div className="w-full rounded-xl border border-white/[0.07] bg-surface-2/60 backdrop-blur-xl p-4 space-y-3">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          {isComplete ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          ) : isError ? (
            <XCircle className="w-4 h-4 text-red-400 shrink-0" />
          ) : (
            <Loader2 className={`w-4 h-4 shrink-0 animate-spin ${isCancelling ? 'text-zinc-400' : 'text-violet-400'}`} />
          )}
          <span className={`text-xs font-semibold truncate ${
            isComplete     ? 'text-emerald-300'
            : isError      ? 'text-red-300'
            : isCancelling ? 'text-zinc-400'
            : 'text-violet-300'
          }`}>
            {isCancelling    ? 'Отмена...'
              : isComplete   ? 'Установка завершена!'
              : isError      ? 'Ошибка установки'
              : isDownloading ? 'Загрузка установщика...'
              : 'Установка...'}
          </span>
        </div>

        {canCancel && (
          <button
            onClick={onCancel}
            title="Отменить установку"
            className="shrink-0 w-6 h-6 flex items-center justify-center rounded-lg border border-white/[0.08] text-zinc-500 hover:text-red-400 hover:border-red-500/25 hover:bg-red-500/[0.08] transition-all duration-150 active:scale-90"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {isDownloading && (
        <>
          <div className="h-1.5 w-full rounded-full bg-white/[0.06] overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-violet-500 via-fuchsia-500 to-violet-400 transition-all duration-500 ease-out"
              style={{ width: `${Math.max(2, percent)}%` }}
            />
          </div>
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-zinc-500">
              {speedMBps > 0.01 ? `${speedMBps.toFixed(1)} МБ/с` : message}
            </span>
            <span className="text-[10px] text-zinc-400 font-mono tabular-nums">{percent}%</span>
          </div>
        </>
      )}

      {isInstalling && !isCancelling && (
        <>
          <div className="h-1.5 w-full rounded-full bg-white/[0.06] overflow-hidden">
            <div className="h-full w-full rounded-full bg-gradient-to-r from-transparent via-violet-500 to-transparent animate-[shimmer_1.6s_ease-in-out_infinite]" />
          </div>
          <p className="text-[11px] text-zinc-400 leading-relaxed transition-all duration-500">
            {installPhrase}
          </p>
        </>
      )}

      {isError && <p className="text-xs text-red-300/80 leading-relaxed">{message}</p>}
      {isComplete && <p className="text-xs text-emerald-300/80">Ollama успешно установлен и готов к работе.</p>}
    </div>
  );
}
