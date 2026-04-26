import { useCallback, useMemo, useState } from 'react';
import { hasText } from '../../Utils/Miscell/textCheck';

export function validatePackRequirements({ originalStrings, translations, modInfo }) {
  const rows = Array.isArray(originalStrings) ? originalStrings : [];
  const safeTranslations = translations || {};

  const missingMainTableRowIds = rows
    .filter((row) => !hasText(safeTranslations[row.id]))
    .map((row) => row.id);

  const resolvedName =
    safeTranslations.name !== undefined
      ? safeTranslations.name
      : modInfo?.name
        ? `${modInfo.name}_RU`
        : '';

  const resolvedAuthor =
    safeTranslations.author !== undefined ? safeTranslations.author : modInfo?.author || '';

  const resolvedUuid =
    safeTranslations.uuid !== undefined ? safeTranslations.uuid : modInfo?.uuid || '';

  const resolvedDescription = safeTranslations.description || '';

  const missingModDataFields = {
    name: !hasText(resolvedName),
    author: !hasText(resolvedAuthor),
    uuid: !hasText(resolvedUuid),
    description: !hasText(resolvedDescription),
  };

  const missingModDataFieldLabels = [];
  if (missingModDataFields.name) missingModDataFieldLabels.push('Имя мода');
  if (missingModDataFields.author) missingModDataFieldLabels.push('Автор');
  if (missingModDataFields.uuid) missingModDataFieldLabels.push('UUID мода');

  const missingSections = {
    mainTable: missingMainTableRowIds.length > 0,
    modData: missingModDataFieldLabels.length > 0,
    description: missingModDataFields.description,
  };

  const isValid = !missingSections.mainTable && !missingSections.modData && !missingSections.description;

  return {
    isValid,
    missingSections,
    missingMainTableRowIds,
    missingMainTableCount: missingMainTableRowIds.length,
    missingModDataFields,
    missingModDataFieldLabels,
  };
}

export default function usePackValidation({ originalStrings, translations, modInfo }) {
  const sourceKey = useMemo(
    () => (Array.isArray(originalStrings) ? originalStrings.map((row) => row.id).join('|') : ''),
    [originalStrings]
  );

  const [validationState, setValidationState] = useState({
    sourceKey: '',
    packValidationSnapshot: null,
    packValidationAttempt: 0,
  });

  const handleValidatePackBeforeOpen = useCallback(() => {
    const validationResult = validatePackRequirements({ originalStrings, translations, modInfo });

    setValidationState((previous) => {
      const normalizedPrevious =
        previous.sourceKey === sourceKey
          ? previous
          : {
              sourceKey,
              packValidationSnapshot: null,
              packValidationAttempt: 0,
            };

      if (validationResult.isValid) {
        return {
          ...normalizedPrevious,
          sourceKey,
          packValidationSnapshot: null,
        };
      }

      return {
        ...normalizedPrevious,
        sourceKey,
        packValidationSnapshot: validationResult,
        packValidationAttempt: normalizedPrevious.packValidationAttempt + 1,
      };
    });

    return validationResult;
  }, [originalStrings, translations, modInfo, sourceKey]);

  const isCurrentSourceState = validationState.sourceKey === sourceKey;
  const packValidationSnapshot = isCurrentSourceState ? validationState.packValidationSnapshot : null;
  const packValidationAttempt = isCurrentSourceState ? validationState.packValidationAttempt : 0;

  return {
    packValidationSnapshot,
    packValidationAttempt,
    handleValidatePackBeforeOpen,
  };
}
