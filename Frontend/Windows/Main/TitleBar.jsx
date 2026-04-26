import React, { useState, useEffect, useCallback } from 'react';
import { ChevronRight } from 'lucide-react';
import UnsavedChangesModal from '../../Shared/ui/modal/UnsavedChangesModal';
import { WindowControls } from './TitleBarButtons';
import NotificationCenter from '../../Shared/NotificationCenter';
import { useLocale } from '../../Locales';

export default function TitleBar({ hasUnsavedChanges, onSaveProject, projectDisplayName, onNavigateToProjects }) {
  const t = useLocale();
  const [confirmModal, setConfirmModal] = useState({ isOpen: false, type: null });

  const handleMinimize = () => {
    if (window.electronAPI?.minimize) window.electronAPI.minimize();
  };

  const handleMaximize = () => {
    if (window.electronAPI?.maximize) window.electronAPI.maximize();
  };

  const executeClose = useCallback(
    (type) => {
      if (type === 'app') {
        if (window.electronAPI?.close) window.electronAPI.close();
      } else if (type === 'project') {
        if (onNavigateToProjects) onNavigateToProjects();
      }
      setConfirmModal({ isOpen: false, type: null });
    },
    [onNavigateToProjects]
  );

  const handleClose = useCallback(() => {
    if (hasUnsavedChanges) {
      setConfirmModal({ isOpen: true, type: 'app' });
    } else {
      executeClose('app');
    }
  }, [hasUnsavedChanges, executeClose]);

  const handleBreadcrumbClick = useCallback(() => {
    if (hasUnsavedChanges) {
      setConfirmModal({ isOpen: true, type: 'project' });
    } else if (onNavigateToProjects) {
      onNavigateToProjects();
    }
  }, [hasUnsavedChanges, onNavigateToProjects]);

  useEffect(() => {
    let unsubscribeOsClose = () => {};
    if (window.electronAPI?.onOsClose) {
      unsubscribeOsClose = window.electronAPI.onOsClose(handleClose);
    }
    return () => { unsubscribeOsClose(); };
  }, [handleClose]);

  return (
    <div
      className="h-9 bg-surface-0/90 backdrop-blur-xl flex items-center select-none shrink-0 border-b border-white/[0.06] relative z-[200]"
      style={{ WebkitAppRegion: 'drag' }}
    >
      {/* Left — breadcrumb navigation */}
      <div className="flex items-center gap-1 shrink-0 pl-3" style={{ WebkitAppRegion: 'no-drag' }}>
        {/* Breadcrumb: Projects › ModName ● */}
        {projectDisplayName && (
          <div className="flex items-center gap-1.5 ml-1">
            <button
              onClick={handleBreadcrumbClick}
              className="text-[10px] font-bold text-zinc-600 uppercase tracking-[0.15em] leading-none hover:text-zinc-400 transition-colors duration-200"
            >
              {t.titleBar.projects}
            </button>
            <ChevronRight className="w-3 h-3 text-zinc-700" />
            <span className="text-[11px] font-semibold text-zinc-400 leading-none max-w-[200px] truncate">
              {projectDisplayName}
            </span>
            {hasUnsavedChanges && (
              <div className="w-1.5 h-1.5 bg-red-400 rounded-full shadow-[0_0_8px_rgba(248,113,113,0.5)] animate-pulse" />
            )}
          </div>
        )}
      </div>

      {/* Spacer */}
      <div className="flex-1" />

      {/* Right — notification center + window controls */}
      <div className="flex items-center gap-2 shrink-0 justify-end" style={{ WebkitAppRegion: 'no-drag' }}>
        <NotificationCenter />
      </div>

      <WindowControls onMinimize={handleMinimize} onMaximize={handleMaximize} onClose={handleClose} />

      <UnsavedChangesModal
        isOpen={confirmModal.isOpen}
        type={confirmModal.type}
        onClose={() => setConfirmModal({ isOpen: false, type: null })}
        onDiscardAndClose={executeClose}
        onSaveAndClose={async (type) => {
          if (onSaveProject) await onSaveProject();
          executeClose(type);
        }}
      />
    </div>
  );
}
