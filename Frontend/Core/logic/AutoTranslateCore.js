import { useCallback, useState } from 'react';

export default function useAutoTranslateModePicker({ disabled, isTranslating, onStart }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [selectedModeId, setSelectedModeId] = useState('');
  const [errorModeId, setErrorModeId] = useState('');
  // No persistent timers used in this hook; keep cleanup trivial.

  const openPanel = useCallback(() => {
    if (disabled || isTranslating) return;
    setIsExpanded(true);
  }, [disabled, isTranslating]);

  const closePanel = useCallback(() => {
    setIsExpanded(false);
    setErrorModeId('');
  }, []);

  const selectMode = useCallback(
    (modeId) => {
      setSelectedModeId(modeId);
      setErrorModeId('');
    },
    []
  );

  const start = useCallback(async (startOptions = {}) => {
    if (!selectedModeId || disabled || isTranslating) return;
    await onStart(selectedModeId, startOptions);
    closePanel();
  }, [closePanel, disabled, isTranslating, onStart, selectedModeId]);

  return {
    isExpanded: isExpanded && !disabled && !isTranslating,
    selectedModeId,
    errorModeId,
    canStart: Boolean(selectedModeId),
    openPanel,
    closePanel,
    selectMode,
    start,
  };
}
