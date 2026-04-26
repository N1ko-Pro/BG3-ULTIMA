import { useState, useCallback, useRef } from 'react';
import { notify } from '../../Shared/notificationCore_utils/notifications';
import { useKeyboardShortcuts } from '../../Utils/Keyboard/useKeyboardShortcuts';
import {
  mapStringDictionaryToRows,
  createEmptyTranslations,
  resolvePersistedProjectName,
} from '../../Windows/Start/StartPage_Utils/projectData';
import { useLocale } from '../../Locales';
import DotNetMissingModal from '../../Shared/ui/modal/DotNetMissingModal';

function buildTranslationsFingerprint(translations) {
  const entries = Object.entries(translations || {})
    .map(([key, value]) => [key, typeof value === 'string' ? value : String(value ?? '')])
    .filter(([, value]) => value !== '')
    .sort(([a], [b]) => a.localeCompare(b));

  return JSON.stringify(entries);
}

export function useProjectManager() {
  const t = useLocale();
  const [originalStrings, setOriginalStrings] = useState(null);
  const [translations, _setTranslations] = useState({});
  const [modInfo, setModInfo] = useState(null);
  const [currentProjectId, setCurrentProjectId] = useState(null);
  const [originalPakPath, setOriginalPakPath] = useState(null);
  const [workspaceDirName, setWorkspaceDirName] = useState(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [isLoadingPak, setIsLoadingPak] = useState(false);
  const [isLoadingProject, setIsLoadingProject] = useState(false);
  const [showDotNetModal, setShowDotNetModal] = useState(false);
  const lastSavedFingerprintRef = useRef(buildTranslationsFingerprint({}));

  // Promise-resolver pattern for the init modal
  const [initModal, setInitModal] = useState(null); // { defaultModName, existingNames, resolve, reject }

  // ── Helpers ──────────────────────────────────────────────────────────────────
  const commitSavedSnapshot = useCallback((savedTranslations) => {
    lastSavedFingerprintRef.current = buildTranslationsFingerprint(savedTranslations);
    setHasUnsavedChanges(false);
  }, []);

  const setTranslations = useCallback((newTrans) => {
    _setTranslations((previous) => {
      const nextTranslations =
        typeof newTrans === 'function' ? newTrans(previous) : newTrans || {};
      const nextFingerprint = buildTranslationsFingerprint(nextTranslations);
      setHasUnsavedChanges(nextFingerprint !== lastSavedFingerprintRef.current);
      return nextTranslations;
    });
  }, []);

  const resetState = useCallback(() => {
    setOriginalStrings(null);
    _setTranslations({});
    setModInfo(null);
    setCurrentProjectId(null);
    setOriginalPakPath(null);
    setWorkspaceDirName(null);
    commitSavedSnapshot({});
  }, [commitSavedSnapshot]);

  // ── Init modal API ────────────────────────────────────────────────────────────
  const confirmInitModal = useCallback((values) => {
    initModal?.resolve(values);
    setInitModal(null);
  }, [initModal]);

  const cancelInitModal = useCallback(() => {
    initModal?.reject(new Error('CANCELLED'));
    setInitModal(null);
  }, [initModal]);

  const requestInitInfo = useCallback((defaultModName, existingProjectNames) => {
    return new Promise((resolve, reject) => {
      setInitModal({ defaultModName, existingNames: existingProjectNames, resolve, reject });
    });
  }, []);

  // ── Core file-loading logic ───────────────────────────────────────────────────
  const handleOpenFile = useCallback(async (filePath, ext) => {
    if (!window.electronAPI) return;

    setIsLoadingPak(true);
    let result;
    try {
      if (ext === '.pak') {
        result = await window.electronAPI.unpackPakFile(filePath);
      } else if (ext === '.zip' || ext === '.rar') {
        result = await window.electronAPI.unpackArchiveFile(filePath, ext);
      } else {
        notify.error(t.projects.unsupportedExt, t.projects.unsupportedExtDesc(ext), 4000);
        return;
      }
    } finally {
      setIsLoadingPak(false);
    }

    if (!result?.success || !result.data) {
      if (result?.error) {
        // Check for .NET runtime missing error
        if (result.error.includes('.NET') || result.error.includes('dotnet') || result.error.includes('hostfxr.dll')) {
          setShowDotNetModal(true);
          return;
        }
        notify.error(t.projects.fileError, result.error, 5000);
      }
      return;
    }

    const { strings, modInfo: unpackedModInfo } = result.data;
    const defaultModName = unpackedModInfo?.name
      ? `${unpackedModInfo.name}_RU`
      : 'BG3 Mod Translation';

    let existingProjectNames = [];
    try {
      const projectsRes = await window.electronAPI.loadProjects();
      existingProjectNames = (projectsRes?.projects || []).map((p) => p.name);
    } catch { /* ignore */ }

    let userInput;
    try {
      userInput = await requestInitInfo(defaultModName, existingProjectNames);
    } catch {
      return; // user cancelled
    }

    setIsLoadingPak(true);
    try {
      const dataArray = mapStringDictionaryToRows(strings);
      const emptyTrans = createEmptyTranslations(dataArray);

      const initTrans = {
        ...emptyTrans,
        name: userInput.modName,
        author: userInput.author,
      };

      setOriginalPakPath(result.data.originalPakPath);
      setCurrentProjectId(null);
      setOriginalStrings(dataArray);
      setModInfo(unpackedModInfo);
      setWorkspaceDirName(result.data.workspaceDirName || null);
      _setTranslations(initTrans);
      setHasUnsavedChanges(false);

      const projectData = {
        id: null,
        name: userInput.modName,
        author: userInput.author,
        pakPath: result.data.originalPakPath,
        workspaceDirName: result.data.workspaceDirName,
        translations: initTrans,
      };

      const res = await window.electronAPI.saveProject(projectData);
      if (res?.success) {
        setCurrentProjectId(res.project.id);
        commitSavedSnapshot(initTrans);
        notify.success(t.projects.created, t.projects.createdDesc(userInput.modName), 3000);
      }
    } finally {
      setIsLoadingPak(false);
    }
  }, [commitSavedSnapshot, requestInitInfo, t.projects]);

  const handleSelectFile = useCallback(async () => {
    if (!window.electronAPI) return;
    const selected = await window.electronAPI.selectFile();
    if (!selected?.success) return;
    await handleOpenFile(selected.filePath, selected.ext);
  }, [handleOpenFile]);


  // ── Save / load / repack ──────────────────────────────────────────────────────
  const handleSaveProject = useCallback(async () => {
    if (!originalStrings || !window.electronAPI || !originalPakPath) return;

    const projectData = {
      id: currentProjectId,
      name: resolvePersistedProjectName({ translations, modInfo }),
      author: translations.author,
      pakPath: originalPakPath,
      workspaceDirName: workspaceDirName || undefined,
      translations,
    };

    const res = await window.electronAPI.saveProject(projectData);
    if (res?.success) {
      setCurrentProjectId(res.project.id);
      commitSavedSnapshot(translations);
      notify.success(t.projects.saved, t.projects.savedDesc, 3000);
    } else {
      notify.error(t.projects.saveError, t.projects.saveErrorDesc, 3000);
    }
  }, [originalStrings, originalPakPath, currentProjectId, translations, modInfo, workspaceDirName, commitSavedSnapshot, t.projects.saved, t.projects.savedDesc, t.projects.saveError, t.projects.saveErrorDesc]);

  const handleLoadProject = useCallback(async (projectSummary) => {
    if (!window.electronAPI) return;
    setIsLoadingProject(true);
    try {
      const res = await window.electronAPI.loadProject(projectSummary.id);
      if (res?.success && res.data) {
        const { strings, modInfo: loadedModInfo, originalPakPath: loadedPakPath, translations: savedTrans } = res.data;
        const dataArray = mapStringDictionaryToRows(strings);
        const hydratedTranslations = {
          ...createEmptyTranslations(dataArray),
          ...(savedTrans || {}),
        };
        setOriginalStrings(dataArray);
        setModInfo(loadedModInfo);
        _setTranslations(hydratedTranslations);
        setOriginalPakPath(loadedPakPath);
        setWorkspaceDirName(res.data.workspaceDirName || null);
        setCurrentProjectId(res.project?.id || projectSummary.id);
        commitSavedSnapshot(hydratedTranslations);
        notify.success(t.projects.loaded, t.projects.loadedDesc, 3000);
      } else {
        notify.error(t.projects.loadError, res?.error || t.projects.saveErrorDesc, 5000);
      }
    } finally {
      setIsLoadingProject(false);
    }
  }, [commitSavedSnapshot, t.projects.loaded, t.projects.loadedDesc, t.projects.loadError, t.projects.saveErrorDesc]);

  const handleSavePak = useCallback(async () => {
    if (!window.electronAPI) return;
    const result = await window.electronAPI.repackMod(translations);
    if (result?.success) {
      notify.success(t.projects.packed, t.projects.packedDesc(result.filePath), 5000);
    } else if (result?.error) {
      notify.error(t.projects.packError, result.error, 5000);
    }
  }, [translations, t.projects]);

  useKeyboardShortcuts({ onSave: handleSaveProject });

  return {
    originalStrings,
    translations,
    setTranslations,
    modInfo,
    hasUnsavedChanges,
    isLoadingPak,
    isLoadingProject,
    showDotNetModal,
    setShowDotNetModal,
    handleSelectFile,
    handleOpenFile,
    handleSaveProject,
    handleCloseProject: resetState,
    handleLoadProject,
    handleSavePak,
    // Init modal
    initModal,
    confirmInitModal,
    cancelInitModal,
  };
}
