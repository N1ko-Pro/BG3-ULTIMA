import React, { useState } from 'react';
import { Loader2, Trash2 } from 'lucide-react';

export function UninstallRow({ isUninstalling, onUninstall }) {
  const [confirming, setConfirming] = useState(false);

  if (isUninstalling) {
    return (
      <div className="flex items-center justify-center gap-2 pt-1">
        <Loader2 className="w-3 h-3 text-red-400 animate-spin" />
        <span className="text-[11px] text-red-400">Удаление...</span>
      </div>
    );
  }

  if (confirming) {
    return (
      <div className="flex items-center justify-center gap-2 pt-1">
        <span className="text-[11px] text-zinc-500">Удалить Ollama и все модели?</span>
        <button
          onClick={() => { setConfirming(false); onUninstall(); }}
          className="text-[11px] font-semibold text-red-400 hover:text-red-300 transition-colors"
        >
          Да, удалить
        </button>
        <span className="text-zinc-700">·</span>
        <button
          onClick={() => setConfirming(false)}
          className="text-[11px] text-zinc-500 hover:text-zinc-300 transition-colors"
        >
          Отмена
        </button>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center pt-1">
      <button
        onClick={() => setConfirming(true)}
        className="flex items-center gap-1.5 text-[11px] text-zinc-600 hover:text-red-400 transition-colors"
      >
        <Trash2 className="w-3 h-3" />
        Удалить Ollama
      </button>
    </div>
  );
}
