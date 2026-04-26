import React from 'react';
import { Info } from 'lucide-react';
import { TIER_CONFIG } from './tierConfig';

export function ModelDescPanel({ model }) {
  if (!model) return null;
  const t = TIER_CONFIG[model.tier] || TIER_CONFIG.lite;
  return (
    <div className={`rounded-xl border p-3.5 transition-all duration-300 animate-[fadeIn_200ms_ease-out] backdrop-blur-xl ${t.card}`}>
      <div className="flex items-start gap-2.5">
        <Info className={`w-3.5 h-3.5 mt-0.5 shrink-0 ${t.badge.split(' ')[0]}`} />
        <div>
          <p className="text-[11.5px] font-semibold text-zinc-200 mb-1">{model.title}</p>
          <p className="text-[11px] text-zinc-400 leading-relaxed">{model.description}</p>
        </div>
      </div>
    </div>
  );
}
