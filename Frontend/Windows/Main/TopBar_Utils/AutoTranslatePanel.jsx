import React, { useEffect, useState, useRef, useCallback } from 'react';
import { Play, Bot, Cpu, ChevronUp, Languages, HelpCircle, Loader2, AlertCircle, Lock } from 'lucide-react';
import { createPortal } from 'react-dom';
import DropdownCore from '../../../Core/design/DropdownCore';
import {
  AUTO_TRANSLATION_METHODS_BY_MODEL,
  AUTO_TRANSLATION_MODELS,
  getModelByMethod,
  OLLAMA_MODEL_DROPDOWN_OPTIONS,
} from '../../Settings/SettingsCore_Utils/autoTranslationConfig';
import { AUTO_TRANSLATION_MODE } from './autoTranslationModes';
import { useAuth } from '../../../Core/logic/AuthCore';
import { useLocale } from '../../../Locales';

function ModeCard({ icon: Icon, label, description, isSelected, hasError, locked, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`group/card relative flex items-center gap-3.5 rounded-2xl border px-4 py-3.5 transition-all duration-200 cursor-pointer select-none text-left w-full ${
        locked
          ? 'border-white/[0.06] bg-white/[0.01] backdrop-blur-2xl opacity-60'
          : hasError
            ? 'border-red-400/30 bg-red-500/[0.06] backdrop-blur-2xl animate-[autoTranslateShake_340ms_ease-in-out]'
            : isSelected
              ? 'border-white/[0.18] bg-white/[0.04] backdrop-blur-2xl shadow-[0_2px_16px_rgba(0,0,0,0.2)]'
              : 'border-white/[0.08] bg-white/[0.02] backdrop-blur-2xl hover:border-white/[0.16] hover:bg-white/[0.06] hover:shadow-[0_4px_20px_rgba(0,0,0,0.25)]'
      }`}
    >
      {/* Top edge highlight */}
      <div className="absolute inset-x-0 top-0 h-[1px] bg-gradient-to-r from-transparent via-white/[0.08] to-transparent rounded-t-2xl" />

      {/* Left glow border — visible when selected */}
      <div className={`absolute h-[calc(100%-16px)] w-[2px] left-[2px] top-[8px] rounded-full transition-all duration-300 ${
        hasError
          ? 'bg-red-400 shadow-[0_0_8px_rgba(248,113,113,0.4)]'
          : isSelected
            ? 'bg-white/60 shadow-[0_0_8px_rgba(255,255,255,0.2)]'
            : 'bg-white/[0.06]'
      }`} />

      <div className={`relative w-9 h-9 rounded-xl flex items-center justify-center border transition-all duration-200 shrink-0 ${
        hasError
          ? 'bg-red-500/[0.12] border-red-500/20'
          : isSelected
            ? 'bg-white/[0.1] border-white/[0.16]'
            : 'bg-white/[0.04] border-white/[0.08] group-hover/card:bg-white/[0.08] group-hover/card:border-white/[0.14]'
      }`}>
        <Icon className={`w-4 h-4 transition-all duration-300 ${
          hasError ? 'text-red-300' : isSelected ? 'text-white' : 'text-zinc-400 group-hover/card:text-zinc-200'
        }`} />
      </div>

      <div className="flex-1 min-w-0">
        <span className={`text-[13px] font-semibold leading-tight transition-colors duration-200 block whitespace-nowrap ${
          hasError ? 'text-red-200' : isSelected ? 'text-white' : 'text-zinc-200 group-hover/card:text-white'
        }`}>
          {label}
        </span>
        <span className={`text-[12px] leading-tight block mt-0.5 transition-colors duration-200 whitespace-nowrap ${
          isSelected ? 'text-zinc-400' : 'text-zinc-500 group-hover/card:text-zinc-400'
        }`}>
          {description}
        </span>
      </div>

      {locked && (
        <Lock className="w-3.5 h-3.5 text-zinc-500 shrink-0 self-start mt-0.5" />
      )}

    </button>
  );
}

export default function AutoTranslatePanel({
  isExpanded,
  selectedModeId,
  errorModeId,
  canStart,
  isTranslating,
  translationSettings,
  onSelectMode,
  onStart,
  onClose,
  onUpdateSettings,
  onAuthRequired,
}) {
  const { canUseAI } = useAuth();
  const t = useLocale();
  const METHOD_LOCALE = {
    single:        t.settings.methodSingle,
    standard:      t.settings.methodStandard,
    compatibility: t.settings.methodCompat,
  };
  const currentOllamaModel = translationSettings?.ollama?.model || '';
  const ollamaModelRaw = currentOllamaModel;
  const currentMethod = translationSettings?.method || 'single';
  const currentSmartModel = getModelByMethod(currentMethod);
  const useDictionarySmart = translationSettings?.smart?.useDictionary ?? false;

  const smartModelOptions = AUTO_TRANSLATION_MODELS.map((m) => ({
    id: m.id,
    title: m.title,
    subtitle: m.subtitle,
  }));

  const smartMethodOptions = (AUTO_TRANSLATION_METHODS_BY_MODEL[currentSmartModel] || []).map((m) => ({
    id: m.id,
    title: m.id === 'compatibility' ? t.settings.methodCompatName : m.name,
    subtitle: METHOD_LOCALE[m.id]?.badge || m.badge,
  }));

  // Derived booleans needed by hooks below
  const isSmartSelected = selectedModeId === AUTO_TRANSLATION_MODE.SMART;
  const isLocalSelected = selectedModeId === AUTO_TRANSLATION_MODE.LOCAL;
  const hasSmartError = errorModeId === AUTO_TRANSLATION_MODE.SMART;
  const hasLocalError = errorModeId === AUTO_TRANSLATION_MODE.LOCAL;
  const hasModeSelected = isSmartSelected || isLocalSelected;
  const useDictionary = isLocalSelected ? true : useDictionarySmart;

  const [tooltipPos, setTooltipPos] = useState(null);
  const tooltipAnchorRef = useRef(null);
  const [installedModelNames, setInstalledModelNames] = useState(null); // null=unknown, string[]=fetched
  const [localServerRunning, setLocalServerRunning] = useState(null); // null=unknown, false=not running

  // Fetch installed Ollama models when LOCAL tab is shown
  useEffect(() => {
    if (!isLocalSelected || !isExpanded) return;
    const getStatus = window.electronAPI?.ollamaGetStatus;
    const promise = getStatus ? getStatus() : Promise.resolve(null);
    promise
      .then((res) => {
        const running = res?.success && res.status?.running;
        setLocalServerRunning(running || false);
        setInstalledModelNames(running ? (res.status?.models || []).map((m) => m.name) : []);
      })
      .catch(() => {
        setLocalServerRunning(false);
        setInstalledModelNames([]);
      });
  }, [isLocalSelected, isExpanded]);

  const isModelInstalledLocal = useCallback((modelId) => {
    if (!installedModelNames) return false;
    const id = modelId.toLowerCase();
    return installedModelNames.some((n) => {
      const nl = n.toLowerCase();
      if (nl === id) return true;
      if (nl === `${id}:latest`) return true;
      if (nl.startsWith(`${id}:`)) return true;
      if (id.includes(':') && nl.startsWith(`${id.split(':')[0]}:`)) return true;
      if (id.startsWith('hf.co/') && nl.includes(id.replace('hf.co/', ''))) return true;
      return false;
    });
  }, [installedModelNames]);

  const installedOllamaOptions = OLLAMA_MODEL_DROPDOWN_OPTIONS.filter((m) => isModelInstalledLocal(m.id));
  const effectiveOllamaModel = isModelInstalledLocal(ollamaModelRaw) ? ollamaModelRaw : '';

  const showTooltip = useCallback(() => {
    if (!tooltipAnchorRef.current) return;
    const rect = tooltipAnchorRef.current.getBoundingClientRect();
    setTooltipPos({ top: rect.bottom + 8, left: rect.left + rect.width / 2 });
  }, []);

  const hideTooltip = useCallback(() => setTooltipPos(null), []);

  const handleOllamaModelChange = (modelId) => {
    onUpdateSettings({ ollama: { model: modelId } });
  };

  const handleSmartModelChange = (modelId) => {
    const methods = AUTO_TRANSLATION_METHODS_BY_MODEL[modelId] || [];
    if (methods.length > 0) {
      onUpdateSettings({ method: methods[0].id });
    }
  };

  const handleSmartMethodChange = (methodId) => {
    onUpdateSettings({ method: methodId });
  };

  const handleUseDictionaryToggle = (value) => {
    if (selectedModeId === AUTO_TRANSLATION_MODE.LOCAL) {
      onUpdateSettings({ local: { useDictionary: value } });
    } else {
      onUpdateSettings({ smart: { useDictionary: value } });
    }
  };

  useEffect(() => {
    const handleKey = (e) => {
      if (e.key === 'Escape' && !isTranslating && isExpanded) onClose();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [isTranslating, isExpanded, onClose]);

  const ANIM_MS = 400;
  const ANIM_EASE = 'cubic-bezier(0.4, 0, 0.2, 1)';

  return (
    <div
      className="atp-wrapper shrink-0 z-40 relative"
      style={{ display: 'grid', gridTemplateRows: isExpanded ? '1fr' : '0fr', transition: `grid-template-rows ${ANIM_MS}ms ${ANIM_EASE}` }}
    >
      <div className="overflow-hidden">
        <div className="pb-5" style={{ transform: 'translateX(-80px)' }}>
          {/* Panel body — centered, compact */}
          <div
            className="relative max-w-[620px] mx-auto border-x border-b border-white/[0.06] bg-surface-1/90 backdrop-blur-2xl rounded-b-2xl shadow-[0_12px_40px_rgba(0,0,0,0.4)]"
            style={{
              clipPath: isExpanded ? 'inset(0 0 0 0 round 0 0 1rem 1rem)' : 'inset(0 40% 100% 40% round 0 0 1rem 1rem)',
              transition: `clip-path ${ANIM_MS}ms ${ANIM_EASE}`,
            }}
          >
            {/* Dot grid background */}
            <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-b-2xl">
              <div
                className="absolute inset-0 opacity-[0.4]"
                style={{
                  backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.18) 1px, transparent 1px)',
                  backgroundSize: '18px 18px',
                }}
              />
              <div className="absolute inset-0" style={{ background: 'radial-gradient(ellipse 70% 50% at 50% 0%, rgba(9,9,11,0.6) 0%, transparent 100%)' }} />
            </div>

            <div className="relative px-5 pt-4 pb-4">
              <div className="flex gap-0">
                {/* Mode selection */}
                <div className="w-[220px] shrink-0 pr-5">
                  <div className="relative flex items-center justify-center mb-3 pointer-events-none">
                    <div className="w-full h-2 border-t border-l border-white/[0.08] rounded-tl-lg" />
                    <span className="text-[11px] text-zinc-500 font-bold px-2 tracking-[0.15em] leading-none bg-surface-1 uppercase whitespace-nowrap">
                      {t.atp.modeHeader}
                    </span>
                    <div className="w-full h-2 border-t border-r border-white/[0.08] rounded-tr-lg" />
                  </div>
                  <div className="space-y-2" data-tutorial="atp-modes">
                    <ModeCard
                      icon={Cpu}
                      label={t.atp.smartLabel}
                      description={t.atp.smartDesc}
                      isSelected={isSmartSelected}
                      hasError={hasSmartError}
                      onClick={() => onSelectMode(AUTO_TRANSLATION_MODE.SMART)}
                    />
                    <ModeCard
                      icon={Bot}
                      label={t.atp.aiLabel}
                      description={canUseAI ? t.atp.aiDescEnabled : t.atp.aiDescLocked}
                      isSelected={isLocalSelected}
                      hasError={hasLocalError}
                      locked={!canUseAI}
                      onClick={() => canUseAI ? onSelectMode(AUTO_TRANSLATION_MODE.LOCAL) : onAuthRequired?.()}
                    />
                  </div>
                </div>

                {/* Vertical divider */}
                <div className="w-px self-stretch shrink-0 bg-gradient-to-b from-white/[0.02] via-white/[0.07] to-white/[0.02]" />

                {/* Settings column — compact */}
                <div className="flex-1 min-w-0 flex flex-col pl-5">
                  {!hasModeSelected ? (
                    <div className="flex-1 flex items-center justify-center">
                      <div className="text-center">
                        <div className="w-10 h-10 rounded-2xl bg-white/[0.03] border border-white/[0.06] flex items-center justify-center mx-auto mb-2.5">
                          <Languages className="w-4.5 h-4.5 text-zinc-600" />
                        </div>
                        <p className="text-zinc-400 text-[13px] font-medium leading-snug">{t.atp.selectModeTitle}</p>
                        <p className="text-zinc-600 text-[12px] mt-0.5">{t.atp.selectModeSub}</p>
                      </div>
                    </div>
                  ) : (
                    <div className="animate-[fadeIn_200ms_ease-out] flex flex-col h-full">
                      <div className="relative flex items-center justify-center mb-2.5 pointer-events-none">
                        <div className="w-full h-2 border-t border-l border-white/[0.08] rounded-tl-lg" />
                        <span className="text-[11px] text-zinc-500 font-bold px-2 tracking-[0.15em] leading-none bg-surface-1 uppercase whitespace-nowrap">
                          {isSmartSelected ? t.atp.smartHeader : t.atp.localHeader}
                        </span>
                        <div className="w-full h-2 border-t border-r border-white/[0.08] rounded-tr-lg" />
                      </div>

                      <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] backdrop-blur-xl px-2.5 py-2" data-tutorial="atp-settings">
                        {isSmartSelected && (
                          <>
                            <div className="flex items-end gap-0">
                              <div className="flex-1 min-w-0">
                                <label className="text-[11px] font-semibold text-zinc-400 mb-0.5 block">{t.atp.modelLabel}</label>
                                <DropdownCore value={currentSmartModel} options={smartModelOptions} onChange={handleSmartModelChange} />
                              </div>
                              <div className="w-px h-7 bg-white/[0.06] mx-2 shrink-0" />
                              <div className="flex-1 min-w-0">
                                <label className="text-[11px] font-semibold text-zinc-400 mb-0.5 block">{t.atp.methodLabel}</label>
                                <DropdownCore value={currentMethod} options={smartMethodOptions} onChange={handleSmartMethodChange} />
                              </div>
                            </div>
                            <div className="mt-3 rounded-2xl border border-white/[0.08] bg-surface-2/70 p-3">
                              <div className="flex items-center justify-between gap-3">
                                <div className="min-w-0">
                                  <div className="flex items-center gap-1.5">
                                    <span className="text-[12px] font-semibold text-zinc-200">{t.atp.dictionaryToggle}</span>
                                    <div className="relative inline-flex">
                                      <div
                                        ref={tooltipAnchorRef}
                                        onMouseEnter={showTooltip}
                                        onMouseLeave={hideTooltip}
                                        className="flex items-center"
                                      >
                                        <HelpCircle
                                          className="w-3.5 h-3.5 text-zinc-500 hover:text-zinc-300 transition-colors duration-200"
                                          aria-hidden="true"
                                        />
                                      </div>
                                      {tooltipPos && createPortal(
                                        <div
                                          className="pointer-events-none fixed z-50 w-56 rounded-xl border border-white/[0.12] bg-surface-2/98 backdrop-blur-2xl text-orange-200/80 text-[12px] p-3 shadow-[0_12px_40px_rgba(0,0,0,0.5)] text-center leading-relaxed whitespace-normal break-words"
                                          style={{ top: tooltipPos.top, left: tooltipPos.left, transform: 'translateX(-50%)' }}
                                        >
                                          {t.atp.dictionaryTooltip}
                                        </div>,
                                        document.body
                                      )}
                                    </div>
                                  </div>
                                </div>
                                <button
                                  type="button"
                                  aria-pressed={useDictionary}
                                  onClick={() => handleUseDictionaryToggle(!useDictionary)}
                                  className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors duration-200 ${useDictionary ? 'bg-emerald-400/80' : 'bg-white/[0.08]'}`}
                                >
                                  <span className={`inline-block h-5 w-5 rounded-full bg-white shadow-sm transform transition-transform duration-200 ${useDictionary ? 'translate-x-5' : 'translate-x-0'}`} />
                                </button>
                              </div>
                            </div>
                          </>
                        )}

                        {isLocalSelected && (
                          <div>
                            <label className="text-[11px] font-semibold text-zinc-400 mb-0.5 block">{t.atp.ollamaModelLabel}</label>
                            {installedModelNames === null ? (
                              <div className="flex items-center gap-2 h-8 px-3 rounded-lg border border-white/[0.07] bg-white/[0.02] text-zinc-600 text-[12px]">
                                <Loader2 className="w-3 h-3 animate-spin shrink-0" />
                                {t.atp.ollamaChecking}
                              </div>
                            ) : localServerRunning === false ? (
                              <div className="flex items-center gap-2 h-8 px-3 rounded-lg border border-amber-500/20 bg-amber-500/[0.05] text-amber-400/70 text-[12px]">
                                <AlertCircle className="w-3 h-3 shrink-0" />
                                {t.atp.ollamaNoServer}
                              </div>
                            ) : installedOllamaOptions.length === 0 ? (
                              <div className="flex items-center gap-2 h-8 px-3 rounded-lg border border-amber-500/20 bg-amber-500/[0.05] text-amber-400/70 text-[12px]">
                                <AlertCircle className="w-3 h-3 shrink-0" />
                                {t.atp.ollamaNoModels}
                              </div>
                            ) : (
                              <DropdownCore value={effectiveOllamaModel} options={installedOllamaOptions} onChange={handleOllamaModelChange} />
                            )}
                          </div>
                        )}
                      </div>

                      {/* Start button */}
                      <div className="mt-2" data-tutorial="atp-start">
                        <button
                          onClick={() => onStart({ useDictionary })}
                          disabled={!canStart || isTranslating}
                          title="Начать перевод"
                          className={`group relative flex h-[34px] w-full items-center justify-center gap-2 rounded-xl border text-[12px] font-semibold transition-all duration-300 overflow-hidden ${
                            canStart && !isTranslating
                              ? 'border-emerald-500/30 bg-emerald-500/[0.08] text-emerald-400 shadow-[0_0_20px_rgba(16,185,129,0.12)] hover:bg-emerald-500/[0.14] hover:border-emerald-400/40 hover:shadow-[0_0_28px_rgba(16,185,129,0.2)] active:scale-[0.98]'
                              : 'border-white/[0.06] bg-white/[0.02] text-zinc-600 cursor-not-allowed'
                          }`}
                        >
                          {canStart && !isTranslating && (
                            <span className="absolute inset-0 bg-emerald-500/[0.04] animate-[pulseGlow_2s_ease-in-out_infinite]" />
                          )}
                          <Play className="relative z-10 h-3.5 w-3.5 ml-0.5" />
                          <span className="relative z-10">{t.atp.startButton}</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Collapse tab — pill at the bottom center of the panel */}
          <div className="flex justify-center relative z-10 -mt-px">
            <button
              onClick={onClose}
              disabled={isTranslating}
              title="Свернуть"
              className="group flex items-center justify-center h-[13px] w-14 rounded-b-xl bg-surface-2/80 border border-t-0 border-white/[0.18] hover:border-white/[0.38] hover:bg-surface-3/80 transition-all duration-200 shadow-[0_4px_10px_rgba(255,255,255,0.05)] disabled:opacity-30 disabled:pointer-events-none"
            >
              <ChevronUp className="w-3 h-3 text-white/45 group-hover:text-white/80 transition-colors duration-200" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
