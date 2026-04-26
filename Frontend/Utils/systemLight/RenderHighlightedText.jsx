import React from 'react';
import { tokenizeGameTextMarkup } from './gameTextMarkup';
import { splitBySearchQuery } from './searchHighlight';

const markupTypeClassNames = {
  break: 'text-sky-300/90',
  lsTag: 'text-fuchsia-300/90',
  generic: 'text-amber-300/90',
  placeholder: 'text-yellow-300/95',
};

const searchHighlightClassName = 'rounded-sm bg-amber-300/35 text-amber-100 px-[1px]';

const RenderHighlightedText = ({ text, mode: variant = 'table', searchQuery = '' }) => {
  const tokens = tokenizeGameTextMarkup(text);

  return tokens.map((token, index) => {
    const queryAwareParts = splitBySearchQuery(token.value, searchQuery);

    if (token.type === 'text') {
      return (
        <React.Fragment key={`text-${index}`}>
          {queryAwareParts.map((part, partIndex) =>
            part.isMatch ? (
              <mark key={`text-part-${index}-${partIndex}`} className={searchHighlightClassName}>
                {part.value}
              </mark>
            ) : (
              <React.Fragment key={`text-part-${index}-${partIndex}`}>{part.value}</React.Fragment>
            )
          )}
        </React.Fragment>
      );
    }

    const tokenClassName =
      token.type === 'placeholder'
        ? markupTypeClassNames.placeholder
        : markupTypeClassNames[token.markupType] || markupTypeClassNames.generic;

    return (
      <span
        key={`tag-${index}`}
        className={`${
          variant === 'editor'
            ? '[overflow-wrap:anywhere]'
            : 'font-mono text-[12px] font-semibold [overflow-wrap:anywhere]'
        } ${tokenClassName}`}
      >
        {queryAwareParts.map((part, partIndex) =>
          part.isMatch ? (
            <mark key={`tag-part-${index}-${partIndex}`} className={searchHighlightClassName}>
              {part.value}
            </mark>
          ) : (
            <React.Fragment key={`tag-part-${index}-${partIndex}`}>{part.value}</React.Fragment>
          )
        )}
      </span>
    );
  });
};

export default RenderHighlightedText;
