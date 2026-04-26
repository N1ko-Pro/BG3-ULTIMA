import React from 'react'
import { ChevronLeft } from 'lucide-react';
import TitleBar from './Windows/Main/TitleBar'
import MainTable from './Windows/Main/MainTable'
import SideBar from './Windows/Main/SideBar'
import StartPage from './Windows/Start/StartPage'
import NotificationCore from './Shared/NotificationCore'
import LoadingCore from './Core/design/LoadingCore'
import { useProjectManager } from './Core/logic/ProjectCore'
import useXmlManager from './Core/logic/XmlCore'
import usePackValidation from './Core/logic/ValidationCore'
import useTranslationSettings from './Core/logic/SettingsManagerCore'
import { resolveProjectDisplayName } from './Windows/Start/StartPage_Utils/projectData'
import { useEscapeBlur } from './Utils/Keyboard/useEscapeBlur'
import { ProjectInitModal } from './Shared/ui/modal/ProjectInitModal'
import { useAuth } from './Core/logic/AuthCore'
import { LocaleProvider } from './Locales'
import ru from './Locales/ru'
import en from './Locales/en'
import TutorialOverlay from './Shared/TutorialOverlay'
import EulaModal from './Shared/ui/eula/EulaModal'
import DotNetMissingModal from './Shared/ui/modal/DotNetMissingModal'
import DotNetInstallModal from './Shared/ui/modal/DotNetInstallModal'
import UpdateAvailableModal from './Shared/update/UpdateAvailableModal'
import InstallingUpdateModal from './Shared/update/InstallingUpdateModal'
import useUpdater from './Shared/update/useUpdater'

const DictionaryPanel = React.lazy(() => import('./Windows/Main/DictionaryPanel'));
const ProfilePanel    = React.lazy(() => import('./Windows/Auth/ProfilePanel'));
const SettingsCore    = React.lazy(() => import('./Windows/Settings/SettingsCore'));
const HomePage        = React.lazy(() => import('./Windows/Auth/WelcomeScreen'));

function App() {
  const [isSettingsOpen, setIsSettingsOpen] = React.useState(false);
  const [isDictionaryOpen, setIsDictionaryOpen] = React.useState(false);
  const [isProfileOpen, setIsProfileOpen] = React.useState(false);
  const [isHomeOverlayOpen, setIsHomeOverlayOpen] = React.useState(false);
  const [isFirstLaunch, setIsFirstLaunch] = React.useState(false);
  const [onboardingReady, setOnboardingReady] = React.useState(false);
  const [onboarding, setOnboarding] = React.useState(null);
  // View navigation: 'projects' → editor (when originalStrings loaded)
  // Home is now accessed via overlay, not a separate view.
  const [currentView, setCurrentView] = React.useState('projects');
  // Transition gate: editor panels render at final positions instantly on mount,
  // then CSS transitions are enabled on the next frame for interactive use.
  const [editorTransitionsReady, setEditorTransitionsReady] = React.useState(false);
  // Active tutorial: null | 'editor' | 'atp' | 'dictionary'
  const [activeTutorial, setActiveTutorial] = React.useState(null);
  // EULA gate — until accepted, everything else (welcome, tutorials, updates) is suppressed.
  const [eulaAccepted, setEulaAccepted] = React.useState(true);
  // Update notification modal — deferred while tutorials / EULA are active.
  const [updateModalOpen, setUpdateModalOpen] = React.useState(false);
  const [updateModalDismissed, setUpdateModalDismissed] = React.useState(false);
  // .NET Runtime install modal — shown after EULA acceptance if .NET is missing.
  const [dotnetInstallModalOpen, setDotnetInstallModalOpen] = React.useState(false);
  const [dotnetModalCompleted, setDotnetModalCompleted] = React.useState(false);
  const auth = useAuth();
  useEscapeBlur();

  // Load onboarding state on mount
  React.useEffect(() => {
    (async () => {
      if (!window.electronAPI?.onboardingGet) { setOnboardingReady(true); return; }
      const res = await window.electronAPI.onboardingGet();
      if (res?.success) {
        setOnboarding(res.data);
        setEulaAccepted(!!res.data.eulaAccepted);
        if (res.data.eulaAccepted && !res.data.welcomeShown) {
          setIsFirstLaunch(true);
          setIsHomeOverlayOpen(true);
        }
      }
      setOnboardingReady(true);
    })();
  }, []);

  const [pendingEulaLang, setPendingEulaLang] = React.useState(null);

  const handleAcceptEula = React.useCallback(async (lang) => {
    setEulaAccepted(true);
    setPendingEulaLang(lang);
    setOnboarding((prev) => prev ? { ...prev, eulaAccepted: true } : { eulaAccepted: true });
    try { await window.electronAPI?.onboardingUpdate({ eulaAccepted: true }); } catch { /* empty */ }
    // Show tutorial after EULA acceptance
    try {
      const res = await window.electronAPI?.onboardingGet?.();
      if (res?.success && !res.data.welcomeShown) {
        setIsFirstLaunch(true);
        setIsHomeOverlayOpen(true);
      }
    } catch { /* empty */ }
  }, []);

  const handleDotNetInstall = React.useCallback(async (onProgress) => {
    const unsubscribe = window.electronAPI?.onDotnetInstallProgress?.((progress) => {
      onProgress(progress);
    });

    try {
      await window.electronAPI?.dotnetInstall?.();
      // Tutorial is already running underneath, just close modal
    } finally {
      unsubscribe?.();
    }
    setDotnetModalCompleted(true);
  }, []);

  const handleDotNetLater = React.useCallback(async () => {
    setDotnetInstallModalOpen(false);
    try { await window.electronAPI?.onboardingUpdate({ dotnetInstallLater: true }); } catch { /* empty */ }
    // Tutorial is already running underneath, just close modal
    setDotnetModalCompleted(true);
  }, []);

  const { translationSettings, updateTranslationSettings } = useTranslationSettings();

  // Apply deferred EULA language choice once the settings hook is available.
  React.useEffect(() => {
    if (!pendingEulaLang || !updateTranslationSettings) return;
    updateTranslationSettings({ general: { appLanguage: pendingEulaLang } }).catch(() => {});
    setPendingEulaLang(null);
  }, [pendingEulaLang, updateTranslationSettings]);

  // ─── Updater wiring ───────────────────────────────────────────────────────
  const updater = useUpdater();
  // Open the update modal when an update becomes available / downloaded,
  // BUT only when nothing else is competing for the user's attention.
  const canShowUpdate =
    eulaAccepted &&
    onboardingReady &&
    !isHomeOverlayOpen &&
    !activeTutorial &&
    !updateModalDismissed &&
    !dotnetInstallModalOpen &&
    dotnetModalCompleted &&
    (updater.state.status === 'available' || updater.state.status === 'downloaded');

  React.useEffect(() => {
    if (canShowUpdate) setUpdateModalOpen(true);
  }, [canShowUpdate]);

  const handleUpdateModalDismiss = React.useCallback(() => {
    setUpdateModalOpen(false);
    setUpdateModalDismissed(true);
  }, []);

  const {
    originalStrings,
    translations,
    setTranslations,
    modInfo,
    hasUnsavedChanges,
    isLoadingPak,
    isLoadingProject,
    handleSelectFile,
    handleOpenFile,
    handleSaveProject,
    handleCloseProject,
    handleLoadProject,
    handleSavePak,
    initModal,
    confirmInitModal,
    cancelInitModal,
    showDotNetModal,
    setShowDotNetModal,
  } = useProjectManager();

  const { handleExportXml, handleImportXml } = useXmlManager({ originalStrings, setTranslations, modInfo });
  const {
    packValidationSnapshot,
    packValidationAttempt,
    handleValidatePackBeforeOpen,
  } = usePackValidation({ originalStrings, translations, modInfo });

  const projectDisplayName = React.useMemo(
    () => resolveProjectDisplayName({ translations, modInfo }),
    [translations, modInfo]
  );

  // ── Mutual exclusion: profile ↔ dictionary panels ──
  const toggleDictionary = React.useCallback(() => {
    setIsDictionaryOpen(v => {
      if (!v) setIsProfileOpen(false);
      return !v;
    });
  }, []);

  const toggleProfile = React.useCallback(() => {
    setIsProfileOpen(v => {
      if (!v) setIsDictionaryOpen(false);
      return !v;
    });
  }, []);

  const handleTutorialComplete = React.useCallback(async () => {
    // After tutorial completes, check for .NET runtime
    try {
      const res = await window.electronAPI?.onboardingGet?.();
      if (res?.success && !res.data.dotnetInstallLater) {
        const isDotNetInstalled = await window.electronAPI?.dotnetCheck?.();
        if (!isDotNetInstalled) {
          setDotnetInstallModalOpen(true);
        } else {
          // Runtime is already installed, mark as completed so update modal can show
          setDotnetModalCompleted(true);
        }
      }
    } catch { /* empty */ }
  }, []);

  const handleNavigateToProjects = React.useCallback(() => {
    setCurrentView('projects');
    setIsHomeOverlayOpen(false);
    // Mark welcome as shown on first launch
    if (isFirstLaunch) {
      setIsFirstLaunch(false);
      setOnboarding(prev => prev ? { ...prev, welcomeShown: true } : prev);
      if (window.electronAPI?.onboardingUpdate) {
        window.electronAPI.onboardingUpdate({ welcomeShown: true });
      }
    }
  }, [isFirstLaunch]);

  const handleOpenHomeOverlay = React.useCallback(() => {
    setIsHomeOverlayOpen(true);
  }, []);

  const pendingTutorialResetRef = React.useRef(false);

  const handleResetTutorial = React.useCallback(async () => {
    const patch = {
      tutorialStartPage: false,
      tutorialEditor: false,
      tutorialAutoTranslate: false,
      tutorialDictionary: false,
    };
    try { await window.electronAPI?.onboardingUpdate(patch); } catch { /* empty */ }
    // Defer state update — apply only when settings modal closes
    pendingTutorialResetRef.current = patch;
  }, []);

  const handleSettingsClose = React.useCallback(() => {
    setIsSettingsOpen(false);
    if (pendingTutorialResetRef.current) {
      const patch = pendingTutorialResetRef.current;
      pendingTutorialResetRef.current = null;
      setOnboarding(prev => prev ? { ...prev, ...patch } : prev);
    }
  }, []);

  // When a project is closed, go back to projects view
  const handleCloseProjectNav = React.useCallback(async () => {
    if (handleCloseProject) await handleCloseProject();
    setCurrentView('projects');
  }, [handleCloseProject]);

  // Close dictionary if user loses access (e.g. logout)
  React.useEffect(() => {
    if (!auth.canUseDictionary && isDictionaryOpen) setIsDictionaryOpen(false);
  }, [auth.canUseDictionary, isDictionaryOpen]);

  // Determine which view to show
  const isEditorView = !!originalStrings;
  const showProjects = !isEditorView && currentView === 'projects';

  // When entering editor view: disable CSS transitions so panels snap to correct
  // positions instantly, then enable them after the first paint for interactive use.
  React.useEffect(() => {
    if (!isEditorView) {
      setEditorTransitionsReady(false);
      return;
    }
    // Reset stale panel state from StartPage
    setIsProfileOpen(false);
    setIsDictionaryOpen(false);
    // Enable transitions one frame later — after the browser has painted
    // the editor at its final layout (all panels collapsed, SideBar expanded).
    const raf = requestAnimationFrame(() => {
      setEditorTransitionsReady(true);
    });
    return () => cancelAnimationFrame(raf);
  }, [isEditorView]);

  // Effective panel state for the editor view — forced closed until transitions are ready
  const editorProfileOpen = isProfileOpen && editorTransitionsReady;
  const editorDictionaryOpen = isDictionaryOpen && editorTransitionsReady;
  const editorPanelTransition = editorTransitionsReady
    ? 'transition-[width] duration-[600ms] ease-[cubic-bezier(0.4,0,0.2,1)]'
    : '';

  // Trigger editor tutorial when entering editor for the first time
  React.useEffect(() => {
    if (isEditorView && editorTransitionsReady && onboarding && !onboarding.tutorialEditor && !activeTutorial) {
      const timer = setTimeout(() => setActiveTutorial('editor'), 800);
      return () => clearTimeout(timer);
    }
  }, [isEditorView, editorTransitionsReady, onboarding, activeTutorial]);

  const appLang = translationSettings?.general?.appLanguage || 'ru';
  const t = appLang === 'en' ? en : ru;

  return (
    <LocaleProvider lang={appLang}>
    <div className="flex flex-col h-screen w-full bg-surface-0 overflow-hidden text-zinc-300 antialiased font-sans">
      <LoadingCore 
        isVisible={isLoadingPak || isLoadingProject} 
        message={isLoadingPak ? t.common.loadingMod : t.common.loadingProject} 
        description={isLoadingPak ? t.common.loadingModDesc : t.common.loadingProjectDesc}
      />
      <TitleBar
        onSaveProject={handleSaveProject}
        onCloseProject={handleCloseProjectNav}
        hasUnsavedChanges={hasUnsavedChanges}
        projectDisplayName={isEditorView ? projectDisplayName : null}
        onNavigateToProjects={isEditorView ? handleCloseProjectNav : null}
      />
      <div className="flex flex-1 min-h-0 relative">
        {!onboardingReady || !eulaAccepted || isHomeOverlayOpen ? (
          <div className="flex-1 bg-surface-0" />
        ) : showProjects ? (
          <StartPage onSelectFile={handleSelectFile} onFileDrop={handleOpenFile} onLoadProject={handleLoadProject} onSettingsOpen={() => setIsSettingsOpen(true)} onOpenHome={handleOpenHomeOverlay} onboarding={onboarding} onOnboardingUpdate={setOnboarding} onTutorialComplete={handleTutorialComplete} />
        ) : (
          <div className="flex-1 overflow-hidden flex w-full relative h-full">
            {/* Left panels container — profile + dictionary (mutually exclusive) */}
            <div className="relative shrink-0 flex">
              {/* Profile panel */}
              <div
                className={`overflow-hidden ${editorPanelTransition}`}
                style={{ width: editorProfileOpen ? '340px' : '0px' }}
              >
                <div className="w-[340px] h-full flex flex-col bg-surface-1/80 backdrop-blur-2xl">
                  <React.Suspense fallback={null}>
                    <ProfilePanel isOpen={editorProfileOpen} />
                  </React.Suspense>
                </div>
              </div>

              {/* Dictionary panel */}
              <div
                className={`overflow-hidden ${editorPanelTransition}`}
                style={{ width: editorDictionaryOpen ? '480px' : '0px' }}
              >
                <div className="w-[480px] h-full flex flex-col bg-surface-1/80 backdrop-blur-2xl">
                  <React.Suspense fallback={null}>
                    <DictionaryPanel isOpen={editorDictionaryOpen} />
                  </React.Suspense>
                </div>
              </div>
              {/* Right border */}
              <div className="w-px bg-white/[0.06] shrink-0" />
              {/* Collapse tab — fades in/out with either panel */}
              <button
                onClick={() => {
                  if (isProfileOpen) setIsProfileOpen(false);
                  else if (isDictionaryOpen) setIsDictionaryOpen(false);
                }}
                title={isProfileOpen ? 'Свернуть профиль' : 'Свернуть словарь'}
                className={`group absolute top-3 -right-[13px] z-40 flex items-center justify-center w-[13px] h-14 rounded-r-xl bg-surface-2/80 border border-l-0 border-white/[0.18] hover:border-white/[0.38] hover:bg-surface-3/80 transition-[opacity,background-color,border-color] duration-[600ms] ease-[cubic-bezier(0.4,0,0.2,1)] shadow-[2px_0_10px_rgba(255,255,255,0.05)] ${(editorProfileOpen || editorDictionaryOpen) ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}
              >
                <ChevronLeft className="w-3 h-3 text-white/45 group-hover:text-white/80 transition-colors duration-200" />
              </button>
            </div>

            <SideBar
              modData={modInfo}
              translations={translations}
              setTranslations={setTranslations}
              packValidation={packValidationSnapshot}
              packValidationAttempt={packValidationAttempt}
              isCompact={editorDictionaryOpen || editorProfileOpen}
              onToggleProfile={toggleProfile}
            />
            <MainTable
              onSaveProject={handleSaveProject}
              onCloseProject={handleCloseProjectNav}
              hasUnsavedChanges={hasUnsavedChanges}
              originalStrings={originalStrings}
              translations={translations}
              setTranslations={setTranslations}
              translationSettings={translationSettings}
              onUpdateSettings={updateTranslationSettings}
              onSavePak={handleSavePak}
              onExportXml={handleExportXml}
              onImportXml={handleImportXml}
              onSettingsOpen={() => setIsSettingsOpen(true)}
              modData={modInfo}
              onValidatePackBeforeOpen={handleValidatePackBeforeOpen}
              packValidation={packValidationSnapshot}
              packValidationAttempt={packValidationAttempt}
              isDictionaryOpen={isDictionaryOpen}
              onToggleDictionary={toggleDictionary}
              onCloseDictionary={() => setIsDictionaryOpen(false)}
              onboarding={onboarding}
              onOnboardingUpdate={setOnboarding}
              activeTutorial={activeTutorial}
              setActiveTutorial={setActiveTutorial}
            />
          </div>
        )}
      </div>
      <NotificationCore />

      {/* Editor tutorial overlay */}
      {activeTutorial === 'editor' && (
        <TutorialOverlay
          id="editor"
          steps={[
            { target: 'editor-sidebar-header', title: t.tutorialEditor.stepSidebar.title, description: t.tutorialEditor.stepSidebar.desc, padding: 6 },
            { target: 'editor-sidebar-modinfo', title: t.tutorialEditor.stepModInfo.title, description: t.tutorialEditor.stepModInfo.desc, padding: 8, position: 'right' },
            { target: 'editor-table-rows', title: t.tutorialEditor.stepTableRows.title, description: t.tutorialEditor.stepTableRows.desc, padding: 6 },
            { target: 'editor-progress', title: t.tutorialEditor.stepProgress.title, description: t.tutorialEditor.stepProgress.desc, padding: 6 },
            { target: 'editor-btn-translate', title: t.tutorialEditor.stepTranslate.title, description: t.tutorialEditor.stepTranslate.desc, padding: 8 },
            { target: 'editor-search', title: t.tutorialEditor.stepSearch.title, description: t.tutorialEditor.stepSearch.desc, padding: 6 },
            { target: 'editor-toolbar', title: t.tutorialEditor.stepToolbar.title, description: t.tutorialEditor.stepToolbar.desc, padding: 6 },
            { target: 'editor-tools', title: t.tutorialEditor.stepTools.title, description: t.tutorialEditor.stepTools.desc, padding: 8 },
            { target: 'editor-xml', title: t.tutorialEditor.stepXml.title, description: t.tutorialEditor.stepXml.desc, padding: 6 },
            { target: 'editor-pack', title: t.tutorialEditor.stepPack.title, description: t.tutorialEditor.stepPack.desc, padding: 6 },
            { target: 'editor-settings-btn', title: t.tutorialEditor.stepSettings.title, description: t.tutorialEditor.stepSettings.desc, padding: 6 },
          ]}
          onComplete={async () => {
            setActiveTutorial(null);
            const updated = { ...onboarding, tutorialEditor: true };
            setOnboarding(updated);
            try { await window.electronAPI.onboardingUpdate({ tutorialEditor: true }); } catch { /* empty */ }
          }}
          onDismiss={() => setActiveTutorial(null)}
        />
      )}
      <ProjectInitModal
        isOpen={!!initModal}
        defaultModName={initModal?.defaultModName || ''}
        existingProjectNames={initModal?.existingNames || []}
        onConfirm={confirmInitModal}
        onCancel={cancelInitModal}
      />
      {isSettingsOpen && (
        <React.Suspense fallback={null}>
          <SettingsCore 
            isOpen={isSettingsOpen} 
            onClose={handleSettingsClose} 
            currentSettings={translationSettings}
            onSaveSettings={updateTranslationSettings}
            onResetTutorial={handleResetTutorial}
          />
        </React.Suspense>
      )}
      {/* Home overlay — accessible from StartPage info button or first launch */}
      {isHomeOverlayOpen && (
        <div className="absolute inset-0 z-[100] flex flex-col">
          <React.Suspense fallback={null}>
            <HomePage onNavigateToProjects={handleNavigateToProjects} isOverlay isFirstLaunch={isFirstLaunch} />
          </React.Suspense>
        </div>
      )}

      {/* EULA gate — shown above everything else until accepted. */}
      <EulaModal
        isOpen={onboardingReady && !eulaAccepted}
        initialLang={appLang}
        onAccept={handleAcceptEula}
      />

      {/* .NET Runtime Install Modal — shown after EULA acceptance if .NET is missing. */}
      <DotNetInstallModal
        isOpen={dotnetInstallModalOpen}
        onInstall={handleDotNetInstall}
        onLater={handleDotNetLater}
        onDismiss={() => setDotnetInstallModalOpen(false)}
      />

      {/* Update-available notification — deferred while tutorials / EULA are active. */}
      <UpdateAvailableModal
        isOpen={updateModalOpen && canShowUpdate}
        onDismiss={handleUpdateModalDismiss}
      />

      {/* Silent-install progress overlay — self-controlled via updater state.
          Shows whenever status === 'installing' and cannot be dismissed. */}
      <InstallingUpdateModal />

      {/* .NET Runtime Missing Modal */}
      <DotNetMissingModal
        isOpen={showDotNetModal}
        onInstall={handleDotNetInstall}
        onDismiss={() => setShowDotNetModal(false)}
      />
    </div>
    </LocaleProvider>
  );
}

export default App
