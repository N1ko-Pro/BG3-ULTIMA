import React from 'react';
import { Minus, Square, X } from 'lucide-react';

export function WindowControls({ onMinimize, onMaximize, onClose }) {
  return (
    <div className="flex h-full" style={{ WebkitAppRegion: 'no-drag' }}>
      <button
        onClick={onMinimize}
        className="w-12 h-full flex items-center justify-center text-zinc-600 hover:bg-surface-3 hover:text-zinc-300 transition-all duration-200"
      >
        <Minus className="w-3.5 h-3.5" />
      </button>
      <button
        onClick={onMaximize}
        className="w-12 h-full flex items-center justify-center text-zinc-600 hover:bg-surface-3 hover:text-zinc-300 transition-all duration-200"
      >
        <Square className="w-3 h-3" />
      </button>
      <button
        onClick={onClose}
        className="w-12 h-full flex items-center justify-center text-zinc-600 hover:bg-red-500/20 hover:text-red-400 transition-all duration-200"
      >
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}
