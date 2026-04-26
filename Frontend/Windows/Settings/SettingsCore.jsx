import React, { useMemo, useState, useEffect } from 'react';
import { Settings, SlidersHorizontal, Sparkles, Bot } from 'lucide-react';
import Modal from '../../Core/design/ModalCore';
import { notify } from '../../Shared/notificationCore_utils/notifications';
import { useLocale } from '../../Locales';
import GeneralPage from './SettingsPages/GeneralPage';
import TranslatePage from './SettingsPages/TranslatePage';
import AiPage from './SettingsPages/AiPage';
import { TabButton, SaveButton } from './SettingsCoreButtons';
import { SETTINGS_TABS } from './SettingsCore_Utils/SettingsConstants';
import { useAuth } from '../../Core/logic/AuthCore';

function normalizeIncomingSettings(settings) {
  return {
    general: {
      appLanguage: settings?.general?.appLanguage || 'ru',
      autoUpdateEnabled: settings?.general?.autoUpdateEnabled ?? true,
    },
    method: settings?.method || 'single',
    ollama: {
      model: settings?.ollama?.model || 'hf.co/IlyaGusev/saiga_yandexgpt_8b_gguf:Q8_0',
    },
  };
}

function hasDraftChanges(draft, current) {
  return (
    draft.method !== current.method ||
    draft.ollama.model !== current.ollama.model ||
    draft.general.appLanguage !== current.general.appLanguage ||
    draft.general.autoUpdateEnabled !== current.general.autoUpdateEnabled
  );
}

export default function SettingsCore({ isOpen, onClose, currentSettings, onSaveSettings, onResetTutorial }) {
  const t = useLocale();
  const normalizedCurrentSettings = useMemo(() => normalizeIncomingSettings(currentSettings), [currentSettings]);
  const { canUseAutoTranslate, canUseAI, isLoggedIn } = useAuth();

  // All tabs always visible
  const allTabs = [SETTINGS_TABS.GENERAL, SETTINGS_TABS.AUTO_TRANSLATION, SETTINGS_TABS.OLLAMA];
  const TAB_LOCALE_KEY = { general: 'general', 'auto-translation': 'smart', ollama: 'ai' };

  // Determine locked tabs based on tier
  const lockedTabs = useMemo(() => {
    const locked = new Set();
    if (!canUseAutoTranslate) locked.add(SETTINGS_TABS.AUTO_TRANSLATION.id);
    if (!canUseAI) locked.add(SETTINGS_TABS.OLLAMA.id);
    return locked;
  }, [canUseAutoTranslate, canUseAI]);

  const [activeTab, setActiveTab] = useState(SETTINGS_TABS.GENERAL.id);
  const [draftSettings, setDraftSettings] = useState(normalizedCurrentSettings);

  // Sync draft if currentSettings changed (e.g. after onSaveSettings confirms update)
  useEffect(() => {
    setDraftSettings(normalizedCurrentSettings);
  }, [normalizedCurrentSettings]);

  const hasChanges = hasDraftChanges(draftSettings, normalizedCurrentSettings);

  const save = async (settingsToSave = null) => {
    const target = settingsToSave || draftSettings;
    const isAutoSave = !!settingsToSave;

    // If manual save and no changes, skip
    if (!isAutoSave && !hasDraftChanges(target, normalizedCurrentSettings)) return;

    const success = await onSaveSettings({
      general: { 
        appLanguage: target.general.appLanguage,
        autoUpdateEnabled: target.general.autoUpdateEnabled,
      },
      method: target.method,
      ollama: { model: target.ollama.model },
    });

    if (!success) {
      if (!isAutoSave) notify.error(t.settings.saveError, t.settings.saveErrorDesc);
      return;
    }

    if (!isAutoSave) {
      notify.success(t.settings.saved, t.settings.savedDesc);
    }
  };

  const footer = <SaveButton hasChanges={hasChanges} onSave={() => save()} />;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={t.settings.appTitle}
      icon={Settings}
      footer={footer}
      closeOnOverlayClick={false}
      showCloseIcon={true}
      maxWidthClass="max-w-xl"
      bodyClassName="h-[60vh] overflow-y-auto"
      titleClassName="text-[22px]"
      headerClassName="backdrop-blur-[90px] bg-black/[0.60] border border-white/10 rounded-t-2xl"
    >
      <div className="space-y-6">
        <div className="rounded-xl border border-white/10 bg-surface-2 p-1">
          <div className="grid gap-1" style={{ gridTemplateColumns: `repeat(${allTabs.length}, minmax(0, 1fr))` }}>
            {allTabs.map((tab) => {
              const isLocked = lockedTabs.has(tab.id);
              return (
                <TabButton
                  key={tab.id}
                  label={t.settings.tabs[TAB_LOCALE_KEY[tab.id]] || tab.label}
                  icon={tab.icon}
                  isActive={activeTab === tab.id}
                  isLocked={isLocked}
                  onClick={() => {
                    if (isLocked) {
                      if (!isLoggedIn) {
                        notify.warning(t.settings.requiresAuth, t.settings.requiresAuthDesc, 4000);
                      } else {
                        notify.warning(t.settings.requiresPremium, t.settings.requiresPremiumDesc, 4000);
                      }
                      return;
                    }
                    setActiveTab(tab.id);
                  }}
                />
              );
            })}
          </div>
        </div>

        {/* Tab description */}
        <div>
          {activeTab === SETTINGS_TABS.GENERAL.id && (
            <div className="rounded-xl border border-indigo-500/[0.08] bg-indigo-500/[0.03] p-3.5 flex items-start gap-2.5">
              <SlidersHorizontal className="w-4 h-4 text-indigo-300/50 mt-0.5 shrink-0" />
              <p className="text-[12px] text-zinc-400 leading-relaxed">
                {t.settings.descGeneral}
              </p>
            </div>
          )}
          {activeTab === SETTINGS_TABS.AUTO_TRANSLATION.id && (
            <div className="rounded-xl border border-violet-500/[0.08] bg-violet-500/[0.03] p-3.5 flex items-start gap-2.5">
              <Sparkles className="w-4 h-4 text-violet-300/50 mt-0.5 shrink-0" />
              <p className="text-[12px] text-zinc-400 leading-relaxed">
                {t.settings.descSmart}
              </p>
            </div>
          )}
          {activeTab === SETTINGS_TABS.OLLAMA.id && (
            <div className="rounded-xl border border-fuchsia-500/[0.08] bg-fuchsia-500/[0.03] p-3.5 flex items-start gap-2.5">
              <Bot className="w-4 h-4 text-fuchsia-300/50 mt-0.5 shrink-0" />
              <p className="text-[12px] text-zinc-400 leading-relaxed">
                {t.settings.descAi}
              </p>
            </div>
          )}
          <div className="mt-4 border-t border-white/[0.06]" />
        </div>

        {activeTab === SETTINGS_TABS.GENERAL.id && (
          <GeneralPage
            appLanguage={draftSettings.general.appLanguage}
            autoUpdateEnabled={draftSettings.general.autoUpdateEnabled}
            onAppLanguageChange={(value) => {
              setDraftSettings((prev) => ({ ...prev, general: { ...prev.general, appLanguage: value } }));
            }}
            onAutoUpdateToggle={(value) => {
              setDraftSettings((prev) => ({ ...prev, general: { ...prev.general, autoUpdateEnabled: value } }));
            }}
            onResetTutorial={onResetTutorial}
          />
        )}

        {activeTab === SETTINGS_TABS.AUTO_TRANSLATION.id && (
          <TranslatePage
            method={draftSettings.method}
            onMethodChange={(method) => {
              setDraftSettings((prev) => ({ ...prev, method }));
            }}
          />
        )}

        {activeTab === SETTINGS_TABS.OLLAMA.id && (
          <AiPage
            ollamaModel={draftSettings.ollama.model}
            onOllamaModelChange={(model) => {
              setDraftSettings((prev) => ({ ...prev, ollama: { ...prev.ollama, model } }));
            }}
          />
        )}
      </div>
    </Modal>
  );
}
