import React from 'react';
import { Save, Lock } from 'lucide-react';
import { useLocale } from '../../Locales';

export function TabButton({ label, icon: Icon, isActive, onClick, isLocked = false }) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center justify-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold transition-all duration-300 ${
        isLocked
          ? 'text-zinc-600 border border-transparent cursor-default'
          : isActive
            ? 'bg-white/[0.09] text-white border border-white/20'
            : 'text-zinc-400 border border-transparent hover:bg-surface-2 hover:text-zinc-200'
      }`}
    >
      <Icon className="w-4 h-4" />
      {label}
      {isLocked && <Lock className="w-3 h-3 text-zinc-600" />}
    </button>
  );
}

export function SaveButton({ hasChanges, onSave }) {
  const t = useLocale();
  return (
    <div className="flex items-center justify-end w-full">
      <button
        onClick={onSave}
        disabled={!hasChanges}
        className={`flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl text-white text-sm font-bold transition-all duration-300 active:scale-95 w-full ${
          hasChanges
            ? 'bg-emerald-500 hover:bg-emerald-400 shadow-[0_0_20px_rgba(16,185,129,0.2)]'
            : 'bg-zinc-700/70 cursor-not-allowed'
        }`}
      >
        <Save className="w-4 h-4" />
        {t.settings.save}
      </button>
    </div>
  );
}
