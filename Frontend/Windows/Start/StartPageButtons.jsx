import React from 'react';
import { Trash2, Pencil } from 'lucide-react';

export function DeleteProjectButton({ onClick }) {
  return (
    <button
      onClick={onClick}
      title="Удалить проект"
      className="shrink-0 w-7 h-7 flex items-center justify-center rounded-lg text-zinc-500 opacity-0 group-hover:opacity-100 hover:text-red-400 hover:bg-red-500/12 transition-all duration-200 focus:outline-none"
    >
      <Trash2 className="w-3.5 h-3.5" />
    </button>
  );
}

export function EditProjectButton({ onClick }) {
  return (
    <button
      onClick={onClick}
      title="Редактировать проект"
      className="shrink-0 w-7 h-7 flex items-center justify-center rounded-lg text-zinc-500 opacity-0 group-hover:opacity-100 hover:text-amber-300 hover:bg-amber-400/[0.1] hover:shadow-[0_0_8px_rgba(251,191,36,0.18)] transition-all duration-200 focus:outline-none"
    >
      <Pencil className="w-3.5 h-3.5" />
    </button>
  );
}
