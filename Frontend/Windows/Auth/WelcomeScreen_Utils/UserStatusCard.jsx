import React from 'react';
import { Crown, Clock, Shield, User, ChevronDown } from 'lucide-react';
import { useLocale } from '../../../Locales';
import { TIER, TIER_COLORS } from '../../../Core/logic/AuthCore';

const TIER_ICON = {
  [TIER.GUEST]:   User,
  [TIER.TRIAL]:   Clock,
  [TIER.FREE]:    Shield,
  [TIER.PREMIUM]: Crown,
};

export function UserStatusCard({ user, tier, trialDaysLeft, isExpanded, onToggle }) {
  const t = useLocale();
  const c = TIER_COLORS[tier] || TIER_COLORS[TIER.GUEST];
  const TierIcon = TIER_ICON[tier] || User;

  return (
    <div className="relative">
      <div
        className="flex items-center gap-3 px-4 py-3 rounded-xl border border-white/[0.08] bg-white/[0.03] backdrop-blur-2xl app-slide-up"
        style={{ animationDelay: '80ms' }}
      >
        {user?.avatar ? (
          <img src={user.avatar} alt="" className="w-10 h-10 rounded-full ring-2 ring-white/[0.08] shrink-0" />
        ) : (
          <div className="w-10 h-10 rounded-full bg-white/[0.06] border border-white/[0.1] flex items-center justify-center shrink-0">
            <User className="w-5 h-5 text-zinc-500" />
          </div>
        )}
        <div className="flex-1 min-w-0">
          <p className="text-[14px] font-semibold text-zinc-100 truncate">{user?.displayName || user?.username}</p>
          <div className="flex items-center gap-2 mt-0.5">
            <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[10px] font-bold tracking-wide uppercase leading-none border ${c.text} ${c.bg} ${c.border}`}>
              <TierIcon className="w-2.5 h-2.5" />
              {t.tiers[tier] || tier}
            </span>
            {tier === TIER.TRIAL && (
              <span className="text-[11px] text-amber-300/60">{t.welcome.trialDaysLeft(trialDaysLeft)}</span>
            )}
          </div>
        </div>
      </div>

      {/* Glass ear/tab at bottom center */}
      <button
        onClick={onToggle}
        className="absolute left-1/2 -translate-x-1/2 -bottom-[11px] z-10 flex items-center justify-center w-10 h-[11px] rounded-b-lg bg-white/[0.04] backdrop-blur-xl border border-t-0 border-white/[0.12] hover:border-white/[0.28] hover:bg-white/[0.08] transition-all duration-300 group"
      >
        <ChevronDown className={`w-2.5 h-2.5 text-white/40 group-hover:text-white/70 transition-all duration-300 ${isExpanded ? 'rotate-180' : ''}`} />
      </button>
    </div>
  );
}
