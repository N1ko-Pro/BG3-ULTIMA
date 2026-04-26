import { useState, useCallback, useRef, useEffect } from 'react';
import { notify } from '../../Shared/notificationCore_utils/notifications';
import { collectPendingTranslationRows, toIdValueDictionary } from '../../Windows/Start/StartPage_Utils/projectData';
import { AUTO_TRANSLATION_MODE } from '../../Windows/Main/TopBar_Utils/autoTranslationModes';
import { useLocale } from '../../Locales';

function formatEta(seconds, t) {
  if (!Number.isFinite(seconds) || seconds <= 0) return '';
  if (seconds < 60) return t.editor.etaSec(Math.ceil(seconds));
  const mins = Math.floor(seconds / 60);
  const secs = Math.ceil(seconds % 60);
  return secs > 0 ? t.editor.etaMinSec(mins, secs) : t.editor.etaMin(mins);
}

export default function useAutoTranslation({ originalStrings, translations, setTranslations }) {
  const t = useLocale();
  const tRef = useRef(t);
  useEffect(() => { tRef.current = t; });
  const [isTranslating, setIsTranslating] = useState(false);
  const [translationProgress, setTranslationProgress] = useState(0);
  const [translationStage, setTranslationStage] = useState('');
  const completionTimerRef = useRef(null);
  const cancelledRef = useRef(false);
  const translationModeRef = useRef('');

  // Smooth progress tracking refs
  const totalItemsRef = useRef(0);
  const baseCompletedRef = useRef(0);
  const startTimeRef = useRef(0);
  const itemProgressCleanupRef = useRef(null);

  useEffect(() => {
    return () => {
      if (completionTimerRef.current) clearTimeout(completionTimerRef.current);
      itemProgressCleanupRef.current?.();
    };
  }, []);

  const updateProgressSmooth = useCallback((overallCompleted) => {
    const total = totalItemsRef.current;
    if (total <= 0) return;

    const progress = Math.min(100, Math.round((overallCompleted / total) * 100));
    setTranslationProgress(progress);

    const elapsed = (Date.now() - startTimeRef.current) / 1000;
    const rate = overallCompleted > 0 ? elapsed / overallCompleted : 0;
    const remaining = (total - overallCompleted) * rate;

    const isLocal = translationModeRef.current === AUTO_TRANSLATION_MODE.LOCAL;
    const modeLabel = isLocal ? tRef.current.editor.modeLocalLabel : tRef.current.editor.modeSmartLabel;
    const etaText = overallCompleted > 2 ? formatEta(remaining, tRef.current) : '';
    const etaSuffix = etaText ? `  •  ${etaText}` : '';

    setTranslationStage(tRef.current.editor.stageProgress(modeLabel, Math.min(overallCompleted, total), total) + etaSuffix);
  }, []);

  const resetOllamaContext = useCallback(async () => {
    try {
      const settingsRes = await window.electronAPI.getTranslationSettings();
      const model = settingsRes?.settings?.ollama?.model;
      if (model) {
        await window.electronAPI.ollamaResetContext(model);
      }
    } catch (err) {
      console.warn('Failed to reset Ollama context:', err);
    }
  }, []);

  const cancelAutoTranslation = useCallback(async () => {
    cancelledRef.current = true;
    setTranslationStage(tRef.current.editor.stageStopping);
    try {
      await window.electronAPI.abortTranslateStrings();
      if (translationModeRef.current === AUTO_TRANSLATION_MODE.LOCAL) {
        await resetOllamaContext();
      }
    } catch (e) {
      console.error('Failed to abort translation:', e);
    }
  }, [resetOllamaContext]);

  const triggerAutoTranslation = useCallback(
    async (modeId = AUTO_TRANSLATION_MODE.SMART, options = {}) => {
      if (!originalStrings || originalStrings.length === 0) return;

      const isLocalMode = modeId === AUTO_TRANSLATION_MODE.LOCAL;

      // For local AI, ensure Ollama server is running (auto-start if needed)
      if (isLocalMode) {
        try {
          const ensureRes = await window.electronAPI.ollamaEnsureRunning();
          if (!ensureRes?.success || !ensureRes?.status?.running) {
            notify.error(t.editor.ollamaNotRunning, t.editor.ollamaNotRunningDesc, 5000);
            return;
          }
        } catch {
          notify.error(t.editor.ollamaError, t.editor.ollamaErrorDesc, 5000);
          return;
        }
      }

      translationModeRef.current = modeId;
      const modeLabel = isLocalMode ? t.editor.modeLocalLabel : t.editor.modeSmartLabel;

      cancelledRef.current = false;
      setIsTranslating(true);
      setTranslationProgress(0);
      setTranslationStage(t.editor.stagePreparing(modeLabel));

      let translationFailed = false;

      try {
        const dataToTranslateArray = collectPendingTranslationRows(originalStrings, translations);

        const totalItems = dataToTranslateArray.length;
        if (totalItems === 0) {
          translationModeRef.current = '';
          setIsTranslating(false);
          return;
        }

        totalItemsRef.current = totalItems;
        baseCompletedRef.current = 0;
        startTimeRef.current = Date.now();

        setTranslationStage(t.editor.stageLaunching(modeLabel));

        // Listen for per-item progress events (both AI and Smart modes emit granular progress)
        itemProgressCleanupRef.current?.();
        if (window.electronAPI?.onTranslationItemProgress) {
          itemProgressCleanupRef.current = window.electronAPI.onTranslationItemProgress(
            ({ completed }) => {
              if (cancelledRef.current) return;
              const overallCompleted = baseCompletedRef.current + completed;
              updateProgressSmooth(overallCompleted);
            }
          );
        } else {
          itemProgressCleanupRef.current = null;
        }

        const chunkSize = 20;
        let completed = 0;

        for (let i = 0; i < totalItems; i += chunkSize) {
          if (cancelledRef.current) break;

          const chunk = dataToTranslateArray.slice(i, i + chunkSize);
          const chunkDict = toIdValueDictionary(chunk, 'text');

          // Update base for per-item progress tracking
          baseCompletedRef.current = completed;

          const result = await window.electronAPI.translateStrings(chunkDict, 'ru', {
            mode: isLocalMode ? 'local' : 'smart',
            ...options,
          });

          if (cancelledRef.current || result?.error === 'ABORTED') break;

          if (result && result.success && result.data) {
            setTranslations((prev) => ({ ...prev, ...result.data }));
            completed += chunk.length;

            // Sync base after chunk so per-item events offset correctly for next chunk
            baseCompletedRef.current = completed;
            updateProgressSmooth(completed);
          } else {
            translationFailed = true;
            notify.error(t.editor.translateError, result?.error || t.editor.translateErrorDesc, 5000);
            break;
          }
        }
      } catch (err) {
        translationFailed = true;
        if (err.message !== 'ABORTED') {
          notify.error(t.editor.translateError, err.message, 5000);
        }
      } finally {
        // Clean up per-item progress listener
        itemProgressCleanupRef.current?.();
        itemProgressCleanupRef.current = null;

        const wasCancelled = cancelledRef.current;
        const wasSuccessful = !wasCancelled && !translationFailed;
        translationModeRef.current = '';

        // Unload model from VRAM after AI translation (success or cancel)
        if (isLocalMode) {
          await resetOllamaContext();
        }

        if (wasCancelled) {
          setTranslationStage(tRef.current.editor.stageStopped);
          setTimeout(() => {
            setIsTranslating(false);
            setTranslationProgress(0);
            setTranslationStage('');
          }, 1000);
        } else {
          setTranslationStage(wasSuccessful ? tRef.current.editor.stageCompleted : tRef.current.editor.translateError);
          completionTimerRef.current = setTimeout(() => {
            setIsTranslating(false);
            setTranslationProgress(0);
            setTranslationStage('');
          }, 1500);
        }
      }
    },
    [originalStrings, translations, setTranslations, updateProgressSmooth, resetOllamaContext, t.editor]
  );

  return {
    isTranslating,
    triggerAutoTranslation,
    cancelAutoTranslation,
    translationProgress,
    translationStage,
  };
}
