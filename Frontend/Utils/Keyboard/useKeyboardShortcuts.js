import { useEffect } from 'react';

function isSaveShortcut(event) {
  return (event.ctrlKey || event.metaKey) && (event.code === 'KeyS' || event.key?.toLowerCase() === 's');
}

function isSearchShortcut(event) {
  return (event.ctrlKey || event.metaKey) && (event.code === 'KeyF' || event.key?.toLowerCase() === 'f');
}

export function useKeyboardShortcuts(callbacks) {
  const { onSave, onFocusSearch } = callbacks;

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (isSaveShortcut(e) && onSave) {
        e.preventDefault();
        onSave();
      } else if (isSearchShortcut(e) && onFocusSearch) {
        e.preventDefault();
        onFocusSearch();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onSave, onFocusSearch]);
}
