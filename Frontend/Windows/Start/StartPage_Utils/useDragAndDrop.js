import { useState, useCallback, useRef } from 'react';

const ACCEPTED_EXTENSIONS = ['.pak', '.zip', '.rar'];

function getFileExt(filename) {
  const dot = filename.lastIndexOf('.');
  return dot === -1 ? '' : filename.slice(dot).toLowerCase();
}

function isValidDropFile(file) {
  return ACCEPTED_EXTENSIONS.includes(getFileExt(file.name));
}

/**
 * Manages file drag-and-drop state and events for a drop zone element.
 *
 * @param {object} options
 * @param {(filePath: string, ext: string) => void} options.onFileDrop  — called when a valid file is dropped
 * @param {() => void}                              [options.onInvalidFile] — called when dropped file is invalid
 *
 * @returns {{ isDragging: boolean, dragHandlers: object }}
 */
export function useDragAndDrop({ onFileDrop, onInvalidFile }) {
  const [isDragging, setIsDragging] = useState(false);
  // Track nested enter/leave events (child elements fire their own drag events)
  const dragCounter = useRef(0);

  const onDragEnter = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounter.current++;
    if (dragCounter.current === 1) {
      setIsDragging(true);
    }
  }, []);

  const onDragOver = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    e.dataTransfer.dropEffect = 'copy';
  }, []);

  const onDragLeave = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounter.current--;
    if (dragCounter.current <= 0) {
      dragCounter.current = 0;
      setIsDragging(false);
    }
  }, []);

  const onDrop = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounter.current = 0;
    setIsDragging(false);

    const files = Array.from(e.dataTransfer?.files || []);
    if (!files.length) return;

    // Find the first supported file
    const validFile = files.find(isValidDropFile);
    if (validFile) {
      // In Electron 32+ file.path is empty under contextIsolation;
      // use webUtils.getPathForFile() exposed via preload instead.
      const filePath = window.electronAPI?.getPathForFile?.(validFile) ?? validFile.path;
      const ext = getFileExt(validFile.name);
      onFileDrop(filePath, ext);
    } else {
      onInvalidFile?.();
    }
  }, [onFileDrop, onInvalidFile]);

  return {
    isDragging,
    dragHandlers: { onDragEnter, onDragOver, onDragLeave, onDrop },
  };
}
