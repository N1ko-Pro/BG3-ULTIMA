import { hasText } from '../../../Utils/Miscell/textCheck';

export function mapStringDictionaryToRows(strings) {
  return Object.entries(strings || {}).map(([id, original]) => ({ id, original }));
}

export function createEmptyTranslations(rows) {
  return (rows || []).reduce((accumulator, row) => {
    accumulator[row.id] = '';
    return accumulator;
  }, {});
}

export function toIdValueDictionary(items, valueKey) {
  return (items || []).reduce((accumulator, item) => {
    if (!item?.id) return accumulator;
    accumulator[item.id] = item[valueKey] ?? '';
    return accumulator;
  }, {});
}

export function collectPendingTranslationRows(rows, translations) {
  return (rows || [])
    .filter((row) => !hasText(translations?.[row.id]))
    .map((row) => ({ id: row.id, text: row.original }));
}

function resolveTranslatedModName(modName) {
  return hasText(modName) ? `${modName}_RU` : '';
}

export function resolveProjectDisplayName({ translations, modInfo }) {
  if (hasText(translations?.name)) {
    return translations.name;
  }

  const translatedModName = resolveTranslatedModName(modInfo?.name);
  return translatedModName || 'BG3 Mod Translation';
}

export function resolvePersistedProjectName({ translations, modInfo }) {
  if (translations?.name !== undefined) {
    return translations.name;
  }

  return resolveTranslatedModName(modInfo?.name) || 'Unknown Mod';
}
