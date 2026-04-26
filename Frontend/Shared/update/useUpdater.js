import { useCallback, useEffect, useRef, useState } from 'react';

// ─────────────────────────────────────────────────────────────────────────────
//  useUpdater
//  React hook wrapping the updater IPC surface.
//
//  Returns:
//    state             — last known updater state (see updateManager.js)
//    currentVersion    — app version string
//    check(silent)     — request check-for-updates
//    download()        — start download of an available update
//    install()         — start the SILENT install (spawns NSIS in the
//                        background, does NOT quit the app yet). The
//                        state transitions to 'installing' so the global
//                        InstallingUpdateModal can pick it up.
//    finalizeInstall() — called by InstallingUpdateModal once its
//                        progress bar hits 100 %. Quits the app so NSIS
//                        can swap the binaries and relaunch us.
// ─────────────────────────────────────────────────────────────────────────────

const DEFAULT_STATE = {
  status: 'idle',
  version: null,
  info: null,
  progress: null,
  error: null,
  checkedAt: null,
};

export default function useUpdater() {
  const [state, setState] = useState(DEFAULT_STATE);
  const [currentVersion, setCurrentVersion] = useState('');
  const unsubRef = useRef(null);

  useEffect(() => {
    let cancelled = false;
    const api = window.electronAPI;
    if (!api?.updaterGetState) return undefined;

    (async () => {
      const res = await api.updaterGetState();
      if (cancelled || !res?.success) return;
      if (res.state) setState(res.state);
      if (res.currentVersion) setCurrentVersion(res.currentVersion);
    })();

    if (api.onUpdaterEvent) {
      unsubRef.current = api.onUpdaterEvent((next) => {
        if (!cancelled && next) setState(next);
      });
    }

    return () => {
      cancelled = true;
      if (typeof unsubRef.current === 'function') unsubRef.current();
    };
  }, []);

  const check = useCallback(async (silent = false) => {
    return window.electronAPI?.updaterCheck?.({ silent });
  }, []);

  const download = useCallback(async () => {
    return window.electronAPI?.updaterDownload?.();
  }, []);

  const install = useCallback(async () => {
    return window.electronAPI?.updaterInstall?.();
  }, []);

  const finalizeInstall = useCallback(async () => {
    return window.electronAPI?.updaterFinalizeInstall?.();
  }, []);

  return { state, currentVersion, check, download, install, finalizeInstall };
}
