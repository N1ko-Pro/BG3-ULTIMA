import React, { useState, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { User, Hash, Info, Type, ScrollText, RefreshCw, HelpCircle } from 'lucide-react';
import InputField from './SideBar_Utils/InputField';
import DescriptionField from './SideBar_Utils/DescriptionField';
import logoSrc from '../../Assets/logo.png';
import { useAuth, TIER_COLORS } from '../../Core/logic/AuthCore';
import { useLocale } from '../../Locales';

export default function SideBar({ disabled, modData, translations, setTranslations, packValidation, packValidationAttempt = 0, isCompact = false, onToggleProfile }) {
  const { uuid = '', author = '', name = '', description = '' } = modData || {};
  const auth = useAuth();
  const t = useLocale();
  const [tooltipPos, setTooltipPos] = useState(null);
  const tooltipAnchorRef = useRef(null);

  const handleTranslate = (key, value) => {
    setTranslations((prev) => ({ ...prev, [key]: value }));
  };

  const handleGenerateUUID = () => {
    setTranslations((prev) => ({ ...prev, uuid: crypto.randomUUID() }));
  };

  const showTooltip = useCallback(() => {
    if (!tooltipAnchorRef.current) return;
    const rect = tooltipAnchorRef.current.getBoundingClientRect();
    setTooltipPos({ top: rect.bottom + 8, left: rect.left + rect.width / 2 });
  }, []);

  const hideTooltip = useCallback(() => setTooltipPos(null), []);

  const isOriginalUuid = !translations.uuid && !!uuid;
  const missingModDataFields = packValidation?.missingModDataFields || {};

  return (
    <div
      className={`border-r border-white/[0.06] bg-surface-1/95 backdrop-blur-2xl flex flex-col h-full shrink-0 z-30 relative transition-[width] duration-[600ms] ease-[cubic-bezier(0.4,0,0.2,1)] overflow-hidden ${
        disabled ? 'opacity-40 pointer-events-none grayscale-[50%]' : ''
      }`}
      style={{ width: isCompact ? '0px' : '340px' }}
    >
      {/* Subtle dot grid behind sidebar */}
      <div className="absolute inset-0 dot-grid opacity-20 pointer-events-none" />
      
      {/* Edge vignette */}
      <div className="absolute inset-0 pointer-events-none" style={{ background: 'linear-gradient(to right, transparent 70%, rgba(9,9,11,0.9) 100%)' }} />

      {/* Header Logo Area */}
      <div className="relative h-20 shrink-0 px-6 border-b border-white/[0.06] flex items-center" data-tutorial="editor-sidebar-header">
        <div className="absolute inset-0 bg-gradient-to-r from-surface-2/60 to-surface-2/40" />
        <div className="absolute inset-x-0 bottom-0 h-[1px] bg-gradient-to-r from-transparent via-white/[0.08] to-transparent" />

        <div className="relative flex items-center gap-3.5 flex-1 min-w-0">
          <div className="w-10 h-10 rounded-xl overflow-hidden shrink-0">
            <img src={logoSrc} alt="BG3 Ultima" className="w-full h-full object-contain" />
          </div>
          <div className={`flex flex-col justify-center whitespace-nowrap transition-opacity duration-300 ${isCompact ? 'opacity-0' : 'opacity-100'}`}>
            <h1 className="text-[15px] font-bold text-zinc-100 leading-tight tracking-tight">BG3 Ultima</h1>
            <p className="text-[10px] text-zinc-600 font-bold tracking-widest uppercase">Translation Tool</p>
          </div>
        </div>

        {/* Profile icon trigger */}
        {onToggleProfile && (
          <button
            onClick={onToggleProfile}
            title="Профиль"
            style={{ transitionDelay: isCompact ? '0ms' : '430ms' }}
            className={`relative w-9 h-9 rounded-full border flex items-center justify-center shrink-0 transition-all duration-200 active:scale-[0.95] ${isCompact ? 'opacity-0 pointer-events-none' : 'opacity-100'} border-white/[0.08] bg-white/[0.03] hover:border-white/[0.16] hover:bg-white/[0.06]`}
          >
            {auth.user?.avatar ? (
              <img src={auth.user.avatar} alt="" className="w-full h-full rounded-full object-cover" />
            ) : (
              <User className={`w-4 h-4 ${auth.isLoggedIn ? 'text-zinc-400' : 'text-zinc-600'}`} />
            )}
            {auth.isLoggedIn && (
              <div className={`absolute -bottom-px -right-px w-2.5 h-2.5 rounded-full border-2 border-surface-1 ${(TIER_COLORS[auth.tier] || TIER_COLORS.guest).dot}`} />
            )}
          </button>
        )}
      </div>

      <div className={`relative flex-1 overflow-y-auto overflow-x-hidden py-6 space-y-8 z-10 transition-[opacity,padding] duration-300 ${isCompact ? 'opacity-0 pointer-events-none px-2' : 'opacity-100 px-4'}`}>
        <div className="w-[308px]" data-tutorial="editor-sidebar-modinfo">
        {/* Mod Info Card */}
        <section>
          <div className="flex items-center gap-3 mb-4">
            <div className="flex-1 h-px bg-gradient-to-r from-transparent via-white/[0.08] to-transparent" />
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-surface-2/80 backdrop-blur-xl border border-white/[0.07] shadow-[0_2px_12px_rgba(0,0,0,0.35)]">
              <Info className="w-3 h-3 text-zinc-500" />
              <span className="text-[10px] font-bold tracking-[0.14em] text-zinc-400 uppercase">{t.sidebar.modData}</span>
            </div>
            <div className="flex-1 h-px bg-gradient-to-l from-transparent via-white/[0.08] to-transparent" />
          </div>

          <div className="flex flex-col gap-2">
            <div className="glass-panel rounded-2xl p-5 glass-panel-hover transition-all duration-300 relative">
              <div className="absolute inset-x-0 top-0 h-[1px] bg-gradient-to-r from-transparent via-white/[0.08] to-transparent rounded-t-2xl" />
              <InputField
                icon={Type}
                label={t.sidebar.modName}
                original={name}
                value={translations.name !== undefined ? translations.name : name + '_RU'}
                onChange={(v) => handleTranslate('name', v.replace(/[\u0400-\u04FF]/g, ''))}
                isRequiredMissing={missingModDataFields.name}
                packValidationAttempt={packValidationAttempt}
                isUserSet={translations.name !== undefined}
              />
            </div>
            <div className="glass-panel rounded-2xl p-5 glass-panel-hover transition-all duration-300 relative">
              <div className="absolute inset-x-0 top-0 h-[1px] bg-gradient-to-r from-transparent via-white/[0.08] to-transparent rounded-t-2xl" />
              <InputField
                icon={User}
                label={t.sidebar.author}
                original={author}
                value={translations.author !== undefined ? translations.author : author}
                onChange={(v) => handleTranslate('author', v)}
                isRequiredMissing={missingModDataFields.author}
                packValidationAttempt={packValidationAttempt}
                isUserSet={translations.author !== undefined}
                mirrorValue={true}
              />
            </div>
            <div className="glass-panel rounded-2xl p-5 glass-panel-hover transition-all duration-300 relative">
              <div className="absolute inset-x-0 top-0 h-[1px] bg-gradient-to-r from-transparent via-white/[0.08] to-transparent rounded-t-2xl" />
              <InputField
                icon={Hash}
                label={t.sidebar.uuid}
                original={translations.uuid || uuid}
                readOnly={true}
                isOriginalUuid={isOriginalUuid}
                isRequiredMissing={missingModDataFields.uuid}
                packValidationAttempt={packValidationAttempt}
                labelEnd={
                  isOriginalUuid ? (
                    <div className="relative inline-flex">
                      <div
                        ref={tooltipAnchorRef}
                        onMouseEnter={showTooltip}
                        onMouseLeave={hideTooltip}
                        className="flex items-center justify-center"
                      >
                        <HelpCircle
                          className="w-[15px] h-[15px] text-orange-400/80 cursor-help hover:text-orange-300 transition-colors"
                          aria-hidden="true"
                        />
                      </div>
                      {tooltipPos &&
                        createPortal(
                          <div
                            className="fixed w-56 bg-surface-2/98 backdrop-blur-2xl border border-orange-500/30 text-orange-200/80 text-[12px] p-3 rounded-xl shadow-[0_12px_40px_rgba(0,0,0,0.5)] z-[200] text-center leading-relaxed pointer-events-none"
                            style={{ top: tooltipPos.top, left: tooltipPos.left, transform: 'translateX(-50%)' }}
                          >
                            {t.sidebar.uuidTooltip}
                          </div>,
                          document.body
                        )}
                    </div>
                  ) : null
                }
                headerEnd={
                  <button
                    onClick={handleGenerateUUID}
                    className="text-[11px] text-zinc-500 hover:text-white font-bold tracking-widest uppercase flex items-center gap-1.5 transition-all duration-200 bg-surface-2 hover:bg-surface-3 px-2.5 py-1.5 rounded-lg border border-white/[0.06] hover:border-white/[0.12]"
                  >
                    <RefreshCw className="w-3 h-3" />
                    {t.editor.generateUuid}
                  </button>
                }
              />
            </div>
          </div>
        </section>

        {/* Description Card */}
        <section className="flex-1 pb-4 mt-8" style={{ animationDelay: '60ms' }} data-tutorial="editor-sidebar-desc">
          <div className="flex items-center gap-3 mb-4">
            <div className="flex-1 h-px bg-gradient-to-r from-transparent via-white/[0.08] to-transparent" />
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-surface-2/80 backdrop-blur-xl border border-white/[0.07] shadow-[0_2px_12px_rgba(0,0,0,0.35)]">
              <ScrollText className="w-3 h-3 text-zinc-500" />
              <span className="text-[10px] font-bold tracking-[0.14em] text-zinc-400 uppercase">{t.sidebar.modDesc}</span>
            </div>
            <div className="flex-1 h-px bg-gradient-to-l from-transparent via-white/[0.08] to-transparent" />
          </div>

          <div className="glass-panel rounded-2xl p-5 flex flex-col glass-panel-hover transition-all duration-300 relative">
            <div className="absolute inset-x-0 top-0 h-[1px] bg-gradient-to-r from-transparent via-white/[0.08] to-transparent rounded-t-2xl" />
            <DescriptionField
              original={description}
              value={translations.description || ''}
              onChange={(v) => handleTranslate('description', v)}
              isRequiredMissing={missingModDataFields.description}
              packValidationAttempt={packValidationAttempt}
              isUserSet={!!translations.description}
            />
          </div>
        </section>
        </div>
      </div>
    </div>
  );
}
