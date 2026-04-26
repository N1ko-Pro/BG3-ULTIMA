import React from 'react';
import SidebarFieldWrapper from './SidebarFieldWrapper';

export default function InputField({
  label,
  original,
  value,
  onChange,
  icon: Icon,
  readOnly,
  isFolder,
  isOriginalUuid,
  isRequiredMissing,
  packValidationAttempt = 0,
  headerEnd,
  labelEnd,
  isUserSet,
  mirrorValue,
}) {
  const [isFocused, setIsFocused] = React.useState(false);
  const [dismissedValidationAttempt, setDismissedValidationAttempt] = React.useState(null);
  const displayValue = value !== undefined ? value : original;
  const isUnknown = original?.includes('Unknown');
  const isValidationHighlighted = isRequiredMissing && dismissedValidationAttempt !== packValidationAttempt;
  const wrapperUnknown = isUnknown || isOriginalUuid;
  // Top readonly field: mirrors user input when mirrorValue=true, otherwise shows original
  const topReadonlyValue = mirrorValue ? (value || original) : original;
  const hasValue = displayValue?.trim()?.length > 0;
  // Orange label only when the field is actually empty (UUID has its own orange logic)
  const isOrangeLabel = !isOriginalUuid && !hasValue;

  return (
    <SidebarFieldWrapper
      isFocused={isFocused}
      value={displayValue}
      isUnknown={wrapperUnknown}
      isFolder={isFolder}
      isOriginalUuid={isOriginalUuid}
      isRequiredMissing={isValidationHighlighted}
      isUserSet={isOriginalUuid ? undefined : isUserSet}
    >
      <div className="flex items-center justify-between mb-2 ml-3 max-w-full">
        <label
          className={`text-xs font-semibold transition-colors duration-200 flex items-center gap-1.5 ${
            isValidationHighlighted
              ? 'text-red-300/80'
              : isFocused
                ? 'text-zinc-200'
                : isOriginalUuid
                  ? 'text-orange-400/70'
                  : isOrangeLabel
                    ? 'text-orange-400/60'
                    : isFolder
                      ? 'text-zinc-400'
                      : displayValue && displayValue.trim()
                        ? 'text-emerald-400/60'
                        : isUnknown
                          ? 'text-orange-400/60'
                          : 'text-zinc-600 group-hover:text-zinc-400'
          }`}
        >
          {Icon && <Icon className="w-3.5 h-3.5 shrink-0" />}
          <span className="truncate">{label}</span>
          {labelEnd && <span className="ml-1 flex items-center">{labelEnd}</span>}
        </label>
        {headerEnd && <div className="shrink-0 ml-2">{headerEnd}</div>}
      </div>

      <div className="space-y-2 ml-3">
        <input
          type="text"
          readOnly
          tabIndex={-1}
          value={topReadonlyValue}
          className={`w-full bg-surface-1 border-l-[3px] border-y border-r border-white/[0.06] rounded-lg px-3 py-1.5 text-[13px] cursor-default shadow-none outline-none transition-[border-color] duration-200 ${
            isFolder
              ? '!border-l-white/20 !bg-surface-2/60 text-zinc-400 italic'
              : isOriginalUuid
                ? '!border-l-orange-400/70 text-orange-200/80 bg-orange-500/[0.05]'
                : isOrangeLabel
                  ? '!border-l-orange-400/50 text-zinc-400'
                  : isFocused
                    ? '!border-l-white/50 text-zinc-200'
                    : displayValue && displayValue.trim()
                      ? '!border-l-emerald-400/50 text-zinc-300'
                      : isUnknown
                        ? '!border-l-orange-400/50 text-zinc-400'
                        : 'border-l-zinc-700 text-zinc-500'
          }`}
        />
        {!readOnly && (
          <div className="relative">
            <input
              type="text"
              onFocus={() => {
                setIsFocused(true);
                if (isValidationHighlighted) {
                  setDismissedValidationAttempt(packValidationAttempt);
                }
              }}
              onBlur={() => setIsFocused(false)}
              value={value || ''}
              onChange={(e) => onChange(e.target.value)}
              placeholder={`Перевести ${label.toLowerCase()}...`}
              className={`input-modern px-3 py-1.5 w-full text-[13px] text-zinc-100 border rounded-lg ${
                isValidationHighlighted
                  ? '!border-red-500/50 focus:!border-red-400/60 focus:!ring-red-500/20 focus:!shadow-[0_0_0_3px_rgba(239,68,68,0.08)]'
                  : 'border-white/[0.08]'
              }`}
            />
          </div>
        )}
      </div>
    </SidebarFieldWrapper>
  );
}
