import React, { useState } from 'react';
import { AlertCircle } from 'lucide-react';

const ModalField = React.forwardRef(function ModalField({ icon: Icon, label, value, onChange, error, onEnter, placeholder }, ref) {
  const [focused, setFocused] = useState(false);
  const hasError = !!error;
  const hasValue = value.trim().length > 0;

  return (
    <div className="flex flex-col gap-1.5">
      <label className={`flex items-center gap-1.5 text-[11px] font-semibold tracking-wide uppercase transition-colors duration-200 ${
        hasError ? 'text-red-400/80' : focused ? 'text-zinc-200' : hasValue ? 'text-emerald-400/70' : 'text-zinc-500'
      }`}>
        {Icon && <Icon className="w-3.5 h-3.5 shrink-0" />}
        {label}
      </label>

      <div className={`relative rounded-xl border transition-all duration-200 ${
        hasError
          ? 'border-red-500/40 bg-red-500/[0.04]'
          : focused
            ? 'border-white/[0.28] bg-surface-3'
            : 'border-white/[0.08] bg-surface-3 hover:border-white/[0.16]'
      }`}>
        <input
          ref={ref}
          type="text"
          value={value}
          placeholder={placeholder}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          onKeyDown={(e) => e.key === 'Enter' && onEnter?.()}
          className="w-full bg-transparent px-3.5 py-2.5 text-[13px] text-zinc-200 placeholder-zinc-600 outline-none rounded-xl"
        />
        {focused && !hasError && (
          <div className="absolute inset-0 rounded-xl ring-2 ring-white/[0.06] pointer-events-none" />
        )}
      </div>

      {hasError && (
        <div className="flex items-center gap-1.5 text-[11px] text-red-400">
          <AlertCircle className="w-3 h-3 shrink-0" />
          <span>{error}</span>
        </div>
      )}
    </div>
  );
});

export default ModalField;
