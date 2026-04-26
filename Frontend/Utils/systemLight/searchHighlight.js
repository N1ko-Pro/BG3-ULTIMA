function escapeRegExp(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export function splitBySearchQuery(text, query) {
  const sourceText = typeof text === 'string' ? text : String(text ?? '');
  const normalizedQuery = typeof query === 'string' ? query.trim() : '';

  if (!normalizedQuery) {
    return [{ value: sourceText, isMatch: false }];
  }

  const pattern = new RegExp(`(${escapeRegExp(normalizedQuery)})`, 'gi');
  const rawParts = sourceText.split(pattern).filter((part) => part !== '');

  if (rawParts.length === 0) {
    return [{ value: sourceText, isMatch: false }];
  }

  const lowerQuery = normalizedQuery.toLowerCase();

  return rawParts.map((part) => ({
    value: part,
    isMatch: part.toLowerCase() === lowerQuery,
  }));
}
