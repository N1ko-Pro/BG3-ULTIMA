import { useState, useEffect, useCallback } from 'react';

const DEFAULT_SETTINGS = {
  general: {
    appLanguage: 'ru',
  },
  method: 'single',
  ollama: {
    model: 'hf.co/IlyaGusev/saiga_yandexgpt_8b_gguf:Q8_0',
  },
  smart: {
    useDictionary: false,
  },
  local: {
    useDictionary: true,
  },
};

export default function useTranslationSettings() {
  const [translationSettings, setTranslationSettings] = useState(DEFAULT_SETTINGS);

  useEffect(() => {
    let cancelled = false;

    const syncSettingsFromBackend = async () => {
      if (!window.electronAPI?.getTranslationSettings) return;

      const response = await window.electronAPI.getTranslationSettings();
      if (!cancelled && response?.success && response?.settings) {
        setTranslationSettings(response.settings);
      }
    };

    syncSettingsFromBackend();
    return () => {
      cancelled = true;
    };
  }, []);

  const updateTranslationSettings = useCallback(async (settingsPatch) => {
    if (!window.electronAPI?.setTranslationSettings) {
      setTranslationSettings((previous) => {
        return {
          ...previous,
          ...settingsPatch,
          general: {
            ...(previous?.general || {}),
            ...(settingsPatch?.general || {}),
          },
          ollama: {
            ...(previous?.ollama || {}),
            ...(settingsPatch?.ollama || {}),
          },
        };
      });
      return true;
    }

    const response = await window.electronAPI.setTranslationSettings(settingsPatch);
    if (response?.success && response?.settings) {
      setTranslationSettings(response.settings);
      return true;
    }

    return false;
  }, []);

  return {
    translationSettings,
    updateTranslationSettings,
  };
}
