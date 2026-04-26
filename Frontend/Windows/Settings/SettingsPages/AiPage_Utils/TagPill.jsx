import React from 'react';
import { TIER_CONFIG } from './tierConfig';

export function TagPill({ label, tier }) {
  const t = TIER_CONFIG[tier] || TIER_CONFIG.lite;
  return (
    <span className={`inline-flex items-center rounded-md border px-1.5 py-0.5 text-[9.5px] font-medium tracking-wide ${t.tag}`}>
      {label}
    </span>
  );
}
