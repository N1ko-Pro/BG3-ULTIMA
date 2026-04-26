const GAME_MARKUP_SPLIT_REGEX = /(<\/?[A-Za-z][^>]*>)/g;
const GAME_MARKUP_TOKEN_REGEX = /^<\/?[A-Za-z][^>]*>$/;
const GAME_PLACEHOLDER_SPLIT_REGEX = /(\[\d+\])/g;
const GAME_PLACEHOLDER_TOKEN_REGEX = /^\[\d+\]$/;

function detectMarkupType(token) {
  const lowerToken = token.toLowerCase();

  if (lowerToken.startsWith('<br') || lowerToken.startsWith('</br')) {
    return 'break';
  }

  if (lowerToken.startsWith('<lstag') || lowerToken.startsWith('</lstag')) {
    return 'lsTag';
  }

  return 'generic';
}

export function tokenizeGameTextMarkup(value) {
  const text = typeof value === 'string' ? value : String(value ?? '');

  return text
    .split(GAME_MARKUP_SPLIT_REGEX)
    .filter(Boolean)
    .reduce((tokens, segment) => {
      if (GAME_MARKUP_TOKEN_REGEX.test(segment)) {
        tokens.push({
          type: 'markup',
          markupType: detectMarkupType(segment),
          value: segment,
        });

        return tokens;
      }

      segment
        .split(GAME_PLACEHOLDER_SPLIT_REGEX)
        .filter(Boolean)
        .forEach((part) => {
          if (GAME_PLACEHOLDER_TOKEN_REGEX.test(part)) {
            tokens.push({
              type: 'placeholder',
              value: part,
            });

            return;
          }

          tokens.push({
            type: 'text',
            value: part,
          });
        });

      return tokens;
    }, []);
}
