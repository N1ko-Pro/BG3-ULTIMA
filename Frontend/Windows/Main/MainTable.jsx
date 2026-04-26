import React, { useMemo, useState, useCallback, useRef } from 'react';
import { Virtuoso } from 'react-virtuoso';
import { AlertCircle, Search } from 'lucide-react';
import TopBar from './TopBar';
import TranslationStatusBar from './TopBar_Utils/TranslationStatusBar';
import AutoTranslatePanel from './TopBar_Utils/AutoTranslatePanel';
import AuthOverlay from '../Auth/AuthOverlay';
import useAutoTranslation from '../../Core/logic/TranslationCore';
import useAutoTranslateModePicker from '../../Core/logic/AutoTranslateCore';
import { useAuth } from '../../Core/logic/AuthCore';
import { AutoTranslateButton } from './TopBarButtons';
import { useKeyboardShortcuts } from '../../Utils/Keyboard/useKeyboardShortcuts';
import VirtualTableRow from './MainTable_Utils/VirtualTableRow';
import { SearchClearButton } from './MainTableButtons';
import { notify } from '../../Shared/notificationCore_utils/notifications';
import { useLocale } from '../../Locales';
import TutorialOverlay from '../../Shared/TutorialOverlay';

export default function MainTable({
  disabled,
  originalStrings,
  translations,
  setTranslations,
  translationSettings,
  onUpdateSettings,
  onSavePak,
  onExportXml,
  onImportXml,
  onSettingsOpen,
  onSaveProject,
  onCloseProject,
  hasUnsavedChanges,
  modData,
  onValidatePackBeforeOpen,
  packValidation,
  packValidationAttempt = 0,
  isDictionaryOpen,
  onToggleDictionary,
  onCloseDictionary,
  onboarding,
  onOnboardingUpdate,
  activeTutorial,
  setActiveTutorial,
}) {
  const [searchQuery, setSearchQuery] = useState('');
  const searchInputRef = useRef(null);
  const [dismissedMissingRowAttempts, setDismissedMissingRowAttempts] = useState(() => ({}));
  const [isAuthOverlayOpen, setIsAuthOverlayOpen] = useState(false);
  const { canUseAutoTranslate } = useAuth();
  const t = useLocale();

  useKeyboardShortcuts({
    onFocusSearch: () => {
      if (searchInputRef.current) {
        searchInputRef.current.focus();
      }
    },
  });

  const { isTranslating, triggerAutoTranslation, cancelAutoTranslation, translationProgress, translationStage } = useAutoTranslation({
    originalStrings,
    translations,
    setTranslations,
  });

  const { isExpanded: isAtpExpanded, selectedModeId, errorModeId, canStart, openPanel: openAtp, closePanel: closeAtp, selectMode, start } =
    useAutoTranslateModePicker({
      disabled: disabled || !originalStrings.length,
      isTranslating,
      onStart: triggerAutoTranslation,
    });

  // Close ATP when user loses auto-translate access (e.g. logout)
  React.useEffect(() => {
    if (!canUseAutoTranslate && isAtpExpanded) closeAtp();
  }, [canUseAutoTranslate, isAtpExpanded, closeAtp]);

  // Gate auto-translate for guests; trigger ATP tutorial on first use
  const handleAutoTranslateOpen = useCallback(() => {
    if (!canUseAutoTranslate) {
      notify.warning(t.editor.authRequired, t.editor.authRequiredDesc, 5000);
      return;
    }
    openAtp();
    if (onboarding && !onboarding.tutorialAutoTranslate && !activeTutorial) {
      setTimeout(() => setActiveTutorial('atp'), 600);
    }
  }, [canUseAutoTranslate, openAtp, t.editor.authRequired, t.editor.authRequiredDesc, onboarding, activeTutorial, setActiveTutorial]);

  const totalCount = originalStrings?.length || 0;
  const translatedCount = useMemo(() => {
    return originalStrings?.filter((row) => translations[row.id] && translations[row.id].trim() !== '').length || 0;
  }, [originalStrings, translations]);

  const hasOriginalUuid = !translations.uuid && !!modData?.uuid;

  // Intercept dictionary toggle for tutorial on first use
  const handleToggleDictionary = useCallback(() => {
    onToggleDictionary();
    if (onboarding && !onboarding.tutorialDictionary && !activeTutorial && !isDictionaryOpen) {
      setTimeout(() => setActiveTutorial('dictionary'), 800);
    }
  }, [onToggleDictionary, onboarding, activeTutorial, setActiveTutorial, isDictionaryOpen]);

  const handleTranslateChange = useCallback(
    (rowId, value) => {
      setTranslations((prev) => ({ ...prev, [rowId]: value }));
    },
    [setTranslations]
  );

  const handleClearTranslation = useCallback(
    (rowId) => {
      setTranslations((prev) => {
        const newTranslations = { ...prev };
        delete newTranslations[rowId];
        return newTranslations;
      });
    },
    [setTranslations]
  );

  const filteredStrings = useMemo(() => {
    if (!searchQuery) return originalStrings || [];
    const q = searchQuery.toLowerCase();
    return originalStrings.filter((row) => {
      const origMatch = row.original?.toLowerCase().includes(q);
      const transMatch = translations[row.id]?.toLowerCase().includes(q);
      return origMatch || transMatch;
    });
  }, [originalStrings, translations, searchQuery]);

  const progress = totalCount > 0 ? Math.round((translatedCount / totalCount) * 100) : 0;
  const missingMainTableRowIdSet = useMemo(() => new Set(packValidation?.missingMainTableRowIds || []), [packValidation]);

  const dismissMissingRowHighlight = useCallback(
    (rowId, isMissingByValidation) => {
      if (!isMissingByValidation) return;
      setDismissedMissingRowAttempts((previous) => {
        if (previous[rowId] === packValidationAttempt) return previous;
        return { ...previous, [rowId]: packValidationAttempt };
      });
    },
    [packValidationAttempt]
  );

  const getProgressGradient = (p) => {
    if (p === 0) return 'from-zinc-700 to-zinc-600';
    if (p < 30) return 'from-rose-500 to-red-500';
    if (p < 60) return 'from-orange-500 to-amber-500';
    if (p < 100) return 'from-lime-400 to-emerald-500';
    return 'from-emerald-500 to-teal-500';
  };

  return (
    <div className="flex-1 flex min-h-0 relative overflow-hidden bg-surface-0">
      {/* Main content */}
      <div className="flex-1 flex flex-col min-h-0 relative overflow-hidden">
      {/* Subtle dot grid background */}
      <div className="absolute inset-0 dot-grid opacity-15 pointer-events-none" />
      {/* Central radial fade */}
      <div className="absolute inset-0 pointer-events-none" style={{ background: 'radial-gradient(ellipse 70% 60% at 50% 30%, rgba(9,9,11,0.92) 0%, transparent 100%)' }} />
      {/* Noise overlay */}
      <svg className="noise-overlay" aria-hidden="true">
        <filter id="mainNoise"><feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="4" stitchTiles="stitch" /></filter>
        <rect width="100%" height="100%" filter="url(#mainNoise)" />
      </svg>

      <TranslationStatusBar visible={isTranslating} stage={translationStage} progress={translationProgress} onCancel={cancelAutoTranslation} />
      <TopBar
        onSettingsOpen={onSettingsOpen}
        onSavePak={onSavePak}
        hasOriginalUuid={hasOriginalUuid}
        onExportXml={onExportXml}
        onImportXml={onImportXml}
        onValidatePackBeforeOpen={onValidatePackBeforeOpen}
        isDictionaryOpen={isDictionaryOpen}
        onToggleDictionary={handleToggleDictionary}
        onCloseDictionary={onCloseDictionary}
        modData={modData}
        onSaveProject={onSaveProject}
        onCloseProject={onCloseProject}
        hasUnsavedChanges={hasUnsavedChanges}
      />
      <AutoTranslatePanel
        isExpanded={isAtpExpanded}
        selectedModeId={selectedModeId}
        errorModeId={errorModeId}
        canStart={canStart}
        isTranslating={isTranslating}
        translationSettings={translationSettings}
        onSelectMode={selectMode}
        onStart={start}
        onClose={closeAtp}
        onUpdateSettings={onUpdateSettings}
        onAuthRequired={() => setIsAuthOverlayOpen(true)}
      />

      <AuthOverlay isOpen={isAuthOverlayOpen} onClose={() => setIsAuthOverlayOpen(false)} />

      <div className="flex-1 min-h-0 overflow-hidden p-4 sm:p-8 scroll-smooth z-10 flex flex-col relative">
        {disabled ? (
          <div className="flex-1 flex flex-col items-center justify-center pt-10 app-fade-in">
            <div className="relative group flex flex-col items-center p-10 rounded-[2rem] bg-surface-2/80 border border-white/[0.07] backdrop-blur-xl w-full max-w-md overflow-hidden transition-all duration-500 hover:bg-surface-3/80 hover:border-white/[0.12]">
              <div className="absolute inset-0 bg-gradient-to-b from-white/[0.03] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <div className="absolute inset-x-0 top-0 h-[1px] bg-gradient-to-r from-transparent via-white/[0.12] to-transparent opacity-60" />

              <div className="relative w-16 h-16 rounded-2xl bg-surface-3 border border-white/[0.08] flex items-center justify-center mb-6">
                <AlertCircle className="w-8 h-8 text-zinc-500 group-hover:text-zinc-300 transition-colors duration-300" />
              </div>

              <h2 className="text-[17px] font-semibold text-zinc-200 mb-2 tracking-wide">{t.editor.noStrings}</h2>
              <p className="text-zinc-500 text-[14px] max-w-[280px] text-center leading-relaxed">
                {t.editor.noStringsDesc}
              </p>
            </div>
          </div>
        ) : (
          <div className="max-w-6xl mx-auto w-full h-full flex flex-col min-h-0 app-slide-up">
            <div className="shrink-0 mb-4 flex items-center pl-1 pr-[14px] gap-0">
                  {/* Progress */}
                  <div className="glass-panel px-5 py-3 rounded-2xl flex items-center shrink-0" data-tutorial="editor-progress">
                    <div className="flex flex-col gap-1.5 items-start">
                      <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest leading-none">
                        {t.editor.progressLabel}
                      </span>
                      <div className="flex items-center gap-3">
                        <div className="w-48 h-1.5 bg-surface-2 rounded-full ring-1 ring-white/[0.1] relative">
                          <div className="absolute inset-0 overflow-hidden rounded-full">
                            <div
                              className={`h-full bg-gradient-to-r ${getProgressGradient(progress)} rounded-full transition-all duration-700 ease-out`}
                              style={{ width: `${progress}%` }}
                            />
                          </div>
                        </div>
                        <span className="text-xs font-semibold text-zinc-300">
                          {translatedCount} / {totalCount}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Horizontal line left */}
                  <div
                    className={`flex-1 h-px bg-gradient-to-r from-transparent via-white/[0.08] to-transparent min-w-4 origin-right transition-[transform,opacity] ${
                      isAtpExpanded ? 'scale-x-0 opacity-0' : 'scale-x-100 opacity-100'
                    }`}
                    style={{ transitionDuration: '400ms', transitionTimingFunction: 'cubic-bezier(0.4, 0, 0.2, 1)' }}
                  />

                  {/* Auto-translate button — center, animates away when panel opens */}
                  <div
                    data-tutorial="editor-btn-translate"
                    className={`transition-all origin-bottom shrink-0 ${
                      isAtpExpanded
                        ? 'scale-y-0 scale-x-50 opacity-0 pointer-events-none translate-y-4'
                        : 'scale-100 opacity-100 translate-y-0'
                    }`}
                    style={{ overflow: 'hidden', transitionDuration: '400ms', transitionTimingFunction: 'cubic-bezier(0.4, 0, 0.2, 1)' }}
                  >
                    <AutoTranslateButton
                      disabled={disabled || !originalStrings.length}
                      isTranslating={isTranslating}
                      onOpen={handleAutoTranslateOpen}
                    />
                  </div>

                  {/* Horizontal line right */}
                  <div
                    className={`flex-1 h-px bg-gradient-to-l from-transparent via-white/[0.08] to-transparent min-w-4 origin-left transition-[transform,opacity] ${
                      isAtpExpanded ? 'scale-x-0 opacity-0' : 'scale-x-100 opacity-100'
                    }`}
                    style={{ transitionDuration: '400ms', transitionTimingFunction: 'cubic-bezier(0.4, 0, 0.2, 1)' }}
                  />

                  {/* Search */}
                  <div className="relative group shrink-0 transition-[max-width] duration-[600ms] ease-[cubic-bezier(0.4,0,0.2,1)] max-w-md w-full" data-tutorial="editor-search">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none z-10">
                      <Search className="w-4 h-4 text-zinc-500 group-focus-within:text-white/60 transition-colors duration-200" />
                    </div>
                    <input
                      ref={searchInputRef}
                      type="text"
                      placeholder={t.editor.searchPlaceholderFull}
                      value={searchQuery || ''}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full bg-surface-2 border border-white/[0.07] [&:not(:focus)]:hover:border-white/[0.12] focus:border-white/[0.4] rounded-2xl py-3 pl-12 pr-10 text-[13px] text-zinc-200 placeholder-zinc-600 outline-none focus:ring-2 focus:ring-white/[0.12] focus:shadow-[0_0_0_3px_rgba(255,255,255,0.04)] focus:bg-surface-3 transition-[border-color,background-color,box-shadow] duration-200 backdrop-blur-xl"
                    />
                    {searchQuery && <SearchClearButton onClick={() => setSearchQuery('')} />}
                  </div>
            </div>

            {/* Table Header */}
            <div className="shrink-0 pb-3 z-20 relative pr-[14px]" data-tutorial="editor-table">
              <div className="relative grid grid-cols-[40px_minmax(0,1fr)_minmax(0,1fr)] gap-4 px-6 py-3.5 rounded-2xl border border-white/[0.07] bg-surface-2/90 backdrop-blur-2xl shadow-[0_2px_16px_rgba(0,0,0,0.2)]">
                <div className="absolute inset-x-0 top-0 h-[1px] bg-gradient-to-r from-transparent via-white/[0.1] to-transparent rounded-t-2xl" />
                <div className="text-xs font-black text-zinc-500 uppercase tracking-widest text-center border-r border-white/[0.07] pr-4">
                  #
                </div>
                <div className="text-xs font-black text-zinc-400 uppercase tracking-widest pl-1 border-r border-white/[0.07] pr-4">
                  {t.editor.colOriginal}
                </div>
                <div className="flex items-center gap-3 text-xs font-black text-zinc-400 uppercase tracking-widest pl-4">
                  <span>{t.editor.colTranslation}</span>
                </div>
              </div>
            </div>

            <div className="flex-1 min-h-0 relative pr-[14px]" data-tutorial="editor-table-rows">
              <Virtuoso
                style={{ height: '100%' }}
                overscan={400}
                computeItemKey={(_, row) => row.id}
                components={{ Footer: () => <div style={{ height: '80px' }} /> }}
                data={filteredStrings}
                itemContent={(_, row) => {
                  const displayIndex = originalStrings.indexOf(row) + 1;
                  const isMissingByValidation = missingMainTableRowIdSet.has(row.id);
                  const isRequiredMissing = isMissingByValidation && dismissedMissingRowAttempts[row.id] !== packValidationAttempt;

                  return (
                    <VirtualTableRow
                      key={row.id}
                      row={row}
                      translation={translations[row.id]}
                      searchQuery={searchQuery}
                      displayIndex={displayIndex}
                      isMissingByValidation={isMissingByValidation}
                      isRequiredMissing={isRequiredMissing}
                      onTranslateChange={handleTranslateChange}
                      onClearTranslation={handleClearTranslation}
                      onDismissHighlight={dismissMissingRowHighlight}
                    />
                  );
                }}
              />
            </div>
          </div>
        )}
      </div>

      {/* ATP tutorial overlay */}
      {activeTutorial === 'atp' && (
        <TutorialOverlay
          id="atp"
          steps={[
            { target: 'atp-modes', title: t.tutorialAtp.stepModes.title, description: t.tutorialAtp.stepModes.desc, padding: 8 },
            { target: 'atp-settings', title: t.tutorialAtp.stepSettings.title, description: t.tutorialAtp.stepSettings.desc, padding: 8 },
            { target: 'atp-start', title: t.tutorialAtp.stepStart.title, description: t.tutorialAtp.stepStart.desc, padding: 8 },
          ]}
          onBeforeStep={(index, _prev) => {
            if (index === 1) { selectMode('smart'); return { track: 400 }; }
          }}
          onComplete={async () => {
            setActiveTutorial(null);
            const updated = { ...onboarding, tutorialAutoTranslate: true };
            onOnboardingUpdate(updated);
            try { await window.electronAPI.onboardingUpdate({ tutorialAutoTranslate: true }); } catch { /* empty */ }
          }}
          onDismiss={() => setActiveTutorial(null)}
        />
      )}

      {/* Dictionary tutorial overlay */}
      {activeTutorial === 'dictionary' && (
        <TutorialOverlay
          id="dict"
          steps={[
            { target: 'dict-panel', title: t.tutorialDict.stepOverview.title, description: t.tutorialDict.stepOverview.desc, padding: 8, position: 'right' },
            { target: 'dict-actions', title: t.tutorialDict.stepActions.title, description: t.tutorialDict.stepActions.desc, padding: 6 },
            { target: 'dict-search', title: t.tutorialDict.stepSearch.title, description: t.tutorialDict.stepSearch.desc, padding: 6 },
            { target: 'dict-table', title: t.tutorialDict.stepTable.title, description: t.tutorialDict.stepTable.desc, padding: 6, position: 'right' },
            { target: 'dict-add', title: t.tutorialDict.stepAddTerm.title, description: t.tutorialDict.stepAddTerm.desc, padding: 6 },
            { target: 'dict-categories', title: t.tutorialDict.stepCategories.title, description: t.tutorialDict.stepCategories.desc, padding: 6, position: 'right' },
            { target: 'dict-letters', title: t.tutorialDict.stepLetterFilter.title, description: t.tutorialDict.stepLetterFilter.desc, padding: 6 },
          ]}
          onComplete={async () => {
            setActiveTutorial(null);
            const updated = { ...onboarding, tutorialDictionary: true };
            onOnboardingUpdate(updated);
            try { await window.electronAPI.onboardingUpdate({ tutorialDictionary: true }); } catch { /* empty */ }
          }}
          onDismiss={() => setActiveTutorial(null)}
        />
      )}
      </div>
    </div>
  );
}
