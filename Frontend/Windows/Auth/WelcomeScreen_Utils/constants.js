import { Languages, Bot, BookOpen, FileCode } from 'lucide-react';
import { TIER } from '../../../Core/logic/AuthCore';

export const TIER_STYLES = {
  guest:   'text-zinc-400 bg-zinc-500/10 border-zinc-500/20',
  trial:   'text-amber-300 bg-amber-500/10 border-amber-500/20',
  free:    'text-sky-300 bg-sky-500/10 border-sky-500/20',
  premium: 'text-violet-300 bg-violet-500/10 border-violet-500/20',
};

export const ICON_COLORS = {
  violet:  'text-violet-400',
  fuchsia: 'text-fuchsia-400',
  amber:   'text-amber-400',
  sky:     'text-sky-400',
};

export const BORDER_COLORS = {
  violet:  'border-violet-500/20',
  fuchsia: 'border-fuchsia-500/20',
  amber:   'border-amber-500/20',
  sky:     'border-sky-500/20',
};

export const GLOW_COLORS = {
  violet:  'from-violet-500/[0.06]',
  fuchsia: 'from-fuchsia-500/[0.06]',
  amber:   'from-amber-500/[0.06]',
  sky:     'from-sky-500/[0.06]',
};

export function getFeatures(t) {
  return [
    { icon: Languages, title: t.welcome.features.smartTitle,      desc: t.welcome.features.smartDesc,      tier: TIER.FREE,    color: 'violet' },
    { icon: Bot,       title: t.welcome.features.aiTitle,         desc: t.welcome.features.aiDesc,         tier: TIER.PREMIUM, color: 'fuchsia' },
    { icon: BookOpen,  title: t.welcome.features.dictionaryTitle, desc: t.welcome.features.dictionaryDesc, tier: TIER.FREE,    color: 'amber' },
    { icon: FileCode,  title: t.welcome.features.xmlTitle,        desc: t.welcome.features.xmlDesc,        tier: TIER.GUEST,   color: 'sky' },
  ];
}
