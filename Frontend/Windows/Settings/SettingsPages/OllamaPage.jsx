import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Cpu, Download, Server, Shield, Zap } from 'lucide-react';
import { useLocale } from '../../../Locales';
import { FeatureBullet } from './OllamaPage_Utils/FeatureBullet';
import { InstallProgress } from './OllamaPage_Utils/InstallProgress';
import { CancelConfirmDialog } from './OllamaPage_Utils/CancelConfirmDialog';

// ─── OllamaPage — install screen only ─────────────────────────────────────────
export default function OllamaInstallerPage({ onInstallComplete }) {
  const t = useLocale();
  const [isInstalling, setIsInstalling] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [installProgress, setInstallProgress] = useState(null);
  const installCleanupRef = useRef(null);
  const isCancellingRef = useRef(false);

  useEffect(() => {
    if (!window.electronAPI?.onOllamaInstallProgress) return;
    const cleanup = window.electronAPI.onOllamaInstallProgress((data) => {
      setInstallProgress(data);
    });
    installCleanupRef.current = cleanup;
    return () => { if (installCleanupRef.current) installCleanupRef.current(); };
  }, []);

  const handleInstall = useCallback(async () => {
    if (!window.electronAPI?.ollamaInstall || isInstalling) return;
    setIsInstalling(true);
    setShowCancelConfirm(false);
    setInstallProgress({ phase: 'downloading', percent: 0, message: 'Инициализация...' });
    try {
      const res = await window.electronAPI.ollamaInstall();
      if (res?.cancelled) {
        setInstallProgress(null);
        return;
      }
      if (res?.success && res?.status) {
        if (isCancellingRef.current) {
          setInstallProgress(null);
          return;
        }
        setInstallProgress({ phase: 'complete', percent: 100, message: '' });
        await new Promise((r) => setTimeout(r, 1500));
        onInstallComplete?.(res.status);
      } else {
        setInstallProgress({ phase: 'error', message: res?.error || 'Установка не завершена. Попробуйте ещё раз.' });
      }
    } catch (err) {
      if (isCancellingRef.current || err?.message?.includes('CANCELLED')) {
        setInstallProgress(null);
      } else {
        setInstallProgress({ phase: 'error', message: err?.message || 'Неизвестная ошибка' });
      }
    } finally {
      setIsInstalling(false);
      isCancellingRef.current = false;
      setIsCancelling(false);
    }
  }, [isInstalling, onInstallComplete]);

  const handleCancelRequest = useCallback(() => {
    setShowCancelConfirm(true);
  }, []);

  const handleCancelConfirm = useCallback(async () => {
    setShowCancelConfirm(false);
    isCancellingRef.current = true;
    setIsCancelling(true);
    try {
      await window.electronAPI?.ollamaCancelInstall?.();
    } catch { /* silent */ }
  }, []);

  const handleCancelAbort = useCallback(() => {
    setShowCancelConfirm(false);
  }, []);

  return (
    <div className="flex flex-col items-center py-1 animate-[fadeIn_220ms_ease-out]">
      <div className="relative mb-4">
        <div className="absolute inset-0 rounded-full bg-violet-500/15 blur-2xl scale-[2.5]" />
        <div className="relative w-14 h-14 rounded-2xl bg-surface-3 border border-violet-500/25 flex items-center justify-center shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]">
          <Server className="w-7 h-7 text-violet-300" />
        </div>
      </div>

      <h3 className="text-sm font-bold text-white mb-1">{t.ollama.notInstalled}</h3>
      <p className="text-[11px] text-zinc-500 text-center mb-4 max-w-[240px] leading-relaxed">
        {t.ollama.description}
      </p>

      <div className="w-full rounded-xl border border-white/[0.07] bg-surface-2/60 backdrop-blur-xl p-3.5 mb-4 space-y-2.5">
        <FeatureBullet icon={Zap}    color="text-amber-400"   bg="bg-amber-500/[0.08]"   border="border border-amber-500/[0.18]"   title={t.ollama.featureOffline}  subtitle={t.ollama.featureOfflineDesc} />
        <FeatureBullet icon={Shield} color="text-emerald-400" bg="bg-emerald-500/[0.08]" border="border border-emerald-500/[0.18]" title={t.ollama.featureNoLimits}   subtitle={t.ollama.featureNoLimitsDesc} />
        <FeatureBullet icon={Cpu}    color="text-sky-400"     bg="bg-sky-500/[0.08]"     border="border border-sky-500/[0.18]"     title={t.ollama.featureGPU}     subtitle={t.ollama.featureGPUDesc} />
      </div>

      {showCancelConfirm && (
        <div className="w-full mb-4">
          <CancelConfirmDialog
            onConfirm={handleCancelConfirm}
            onAbort={handleCancelAbort}
            isInstallingPhase={installProgress?.phase === 'installing'}
          />
        </div>
      )}

      {installProgress && (
        <div className={`w-full mb-4 ${showCancelConfirm ? 'hidden' : ''}`}>
          <InstallProgress
            progress={installProgress}
            onCancel={handleCancelRequest}
            isCancelling={isCancelling}
          />
        </div>
      )}

      {(!installProgress || installProgress.phase === 'error') && !isInstalling && !showCancelConfirm && (
        <button
          onClick={handleInstall}
          className="w-full flex items-center justify-center gap-2 h-10 rounded-xl border border-violet-500/30 bg-violet-500/[0.08] text-violet-200 text-sm font-semibold transition-all duration-200 hover:bg-violet-500/[0.14] hover:border-violet-400/40 hover:shadow-[0_0_20px_rgba(139,92,246,0.15)] active:scale-[0.98]"
        >
          <Download className="w-4 h-4" />
          {t.ollama.installButton}
        </button>
      )}

      <p className="text-[10px] text-zinc-600 mt-2 text-center">{t.ollama.systemInfo}</p>
    </div>
  );
}
