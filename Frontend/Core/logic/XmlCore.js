import { useCallback } from 'react';
import { notify } from '../../Shared/notificationCore_utils/notifications';
import { toIdValueDictionary } from '../../Windows/Start/StartPage_Utils/projectData';
import { useLocale } from '../../Locales';

export default function useXmlManager({ originalStrings, setTranslations, modInfo }) {
  const t = useLocale();
  const handleExportXml = useCallback(async () => {
    if (!window.electronAPI || !originalStrings) return;

    const origDict = toIdValueDictionary(originalStrings, 'original');
    const result = await window.electronAPI.exportXml(origDict, modInfo);

    if (result && result.success) {
      notify.success(t.xml.exportSuccess, t.xml.exportSuccessDesc, 3000);
    } else if (result?.error) {
      notify.error(t.xml.exportError, result.error, 5000);
    }
  }, [originalStrings, modInfo, t.xml.exportSuccess, t.xml.exportSuccessDesc, t.xml.exportError]);

  const handleImportXml = useCallback(async () => {
    if (!window.electronAPI) return;

    const result = await window.electronAPI.importXml();

    if (result && result.success) {
      setTranslations((prev) => ({
        ...prev,
        ...result.translations,
      }));
      notify.success(t.xml.importSuccess, t.xml.importSuccessDesc, 3000);
    } else if (result?.error) {
      notify.error(t.xml.importError, result.error, 5000);
    }
  }, [setTranslations, t.xml.importSuccess, t.xml.importSuccessDesc, t.xml.importError]);

  return {
    handleExportXml,
    handleImportXml,
  };
}
