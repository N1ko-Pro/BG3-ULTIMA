import React from 'react';
import { TIER, TIER_COLORS } from '../Core/logic/AuthCore';
import { User, Clock, Shield, Crown, Code2 } from 'lucide-react';
import { useLocale } from '../Locales';

const TIER_ICONS = {
  [TIER.GUEST]: User,
  [TIER.TRIAL]: Clock,
  [TIER.FREE]: Shield,
  [TIER.PREMIUM]: Crown,
  [TIER.DEVELOPER]: Code2,
};

const SIZES = {
  sm: { gap: 'gap-1', px: 'px-1.5', py: 'py-0.5', rounded: 'rounded-md', icon: 'w-2.5 h-2.5' },
  md: { gap: 'gap-1.5', px: 'px-2', py: 'py-1', rounded: 'rounded-lg', icon: 'w-3 h-3' },
};

export default function TierBadge({ tier, size = 'md' }) {
  const t = useLocale();
  const c = TIER_COLORS[tier] || TIER_COLORS[TIER.GUEST];
  const label = t.tiers[tier] || tier;
  const Icon = TIER_ICONS[tier] || User;
  const s = SIZES[size] || SIZES.md;

  return (
    <span
      className={`inline-flex items-center ${s.gap} ${s.px} ${s.py} ${s.rounded} text-[11px] font-bold tracking-wide uppercase leading-none border ${c.text} ${c.bg} ${c.border}`}
    >
      <Icon className={s.icon} />
      {label}
    </span>
  );
}
