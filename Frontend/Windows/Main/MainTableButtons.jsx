import React from 'react';
import { X } from 'lucide-react';

export function SearchClearButton({ onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="absolute inset-y-0 right-2 flex items-center justify-center text-zinc-400 hover:text-zinc-100 transition-colors"
      aria-label="Очистить поиск"
    >
      <X className="w-4 h-4" />
    </button>
  );
}
