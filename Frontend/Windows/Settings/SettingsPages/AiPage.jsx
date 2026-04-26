import React, { useState, useEffect, useCallback, useRef } from 'react';
import { AlertTriangle, Bot, Loader2, Server } from 'lucide-react';
import { OLLAMA_MODEL_DROPDOWN_OPTIONS } from '../SettingsCore_Utils/autoTranslationConfig';
import OllamaInstallerPage from './OllamaPage';
import { ModelCard } from './AiPage_Utils/ModelCard';
import { RefreshButton } from './AiPage_Utils/RefreshButton';
import { UninstallRow } from './AiPage_Utils/UninstallRow';

const OLLAMA_MODEL_OPTIONS = OLLAMA_MODEL_DROPDOWN_OPTIONS;

// ─── Main export ──────────────────────────────────────────────────────────────
export default function AiPage({ ollamaModel, onOllamaModelChange }) {
  const [status, setStatus] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isStarting, setIsStarting] = useState(false);
  const [isUninstalling, setIsUninstalling] = useState(false);
  const [pullingModel, setPullingModel] = useState(null);
  const [isCancellingPull, setIsCancellingPull] = useState(false);
  const [pullProgress, setPullProgress] = useState(0);
  const [pullStatus, setPullStatus] = useState('');
  const [pullSpeedMbs, setPullSpeedMbs] = useState(0);
  const [deletingModelId, setDeletingModelId] = useState(null);
  const pullCleanupRef = useRef(null);
  const pullingModelRef = useRef(null);
  const pullSpeedRef = useRef({ completed: 0, ts: 0 });

  const refreshStatus = useCallback(async () => {
    if (!window.electronAPI?.ollamaGetStatus) return;
    setIsLoading(true);
    try {
      const res = await window.electronAPI.ollamaGetStatus();
      if (res?.success) {
        setStatus(res.status);
        // Sync active pull if any
        if (res.status.pullingModel && !pullingModelRef.current) {
          setPullingModel(res.status.pullingModel);
          pullingModelRef.current = res.status.pullingModel;
        }
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { refreshStatus(); }, [refreshStatus]);

  useEffect(() => {
    if (!window.electronAPI?.onOllamaPullProgress) return;
    const cleanup = window.electronAPI.onOllamaPullProgress((data) => {
      // If we got progress for a model, but UI doesn't know it's pulling (e.g. window reopened)
      if (data.model && !pullingModelRef.current) {
        setPullingModel(data.model);
        pullingModelRef.current = data.model;
      }

      if (data.total > 0) {
        setPullProgress(Math.round((data.completed / data.total) * 100));
        const now = Date.now();
        const prev = pullSpeedRef.current;
        const dtSec = (now - prev.ts) / 1000;
        if (prev.ts > 0 && dtSec > 0) {
          if (data.completed > prev.completed) {
            // Normal progress on same blob
            if (dtSec >= 0.05) {
              setPullSpeedMbs((data.completed - prev.completed) / dtSec / (1024 * 1024));
              pullSpeedRef.current = { completed: data.completed, ts: now };
            }
          } else {
            // completed reset → new blob started, reset the ref
            pullSpeedRef.current = { completed: data.completed, ts: now };
          }
        } else {
          pullSpeedRef.current = { completed: data.completed, ts: now };
        }
      }
      if (data.status) setPullStatus(data.status);

      if (data.status === 'success' || data.status?.includes('success')) {
        const modelId = pullingModelRef.current;
        pullingModelRef.current = null;
        setPullingModel(null);
        setPullProgress(0);
        setPullStatus('');
        setPullSpeedMbs(0);
        pullSpeedRef.current = { completed: 0, ts: 0 };
        setIsCancellingPull(false);

        // Auto-select the newly installed model
        if (modelId) onOllamaModelChange(modelId);

        refreshStatus();
      }
    });
    pullCleanupRef.current = cleanup;
    return () => { if (pullCleanupRef.current) pullCleanupRef.current(); };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleStartServer = useCallback(async () => {
    if (!window.electronAPI?.ollamaStartServer) return;
    setIsStarting(true);
    try {
      const res = await window.electronAPI.ollamaStartServer();
      if (res?.success && res?.status) setStatus(res.status);
    } catch { /* silent */ } finally {
      setIsStarting(false);
    }
  }, []);

  const handlePull = useCallback(async (modelId) => {
    if (!window.electronAPI?.ollamaPullModel) return;
    pullingModelRef.current = modelId;
    setPullingModel(modelId);
    setPullProgress(0);
    setPullStatus('');
    setIsCancellingPull(false);
    try {
      const res = await window.electronAPI.ollamaPullModel(modelId);
      if (res?.success && !res?.cancelled && res?.status) setStatus(res.status);
    } catch { /* cancellation handled by handleCancelPull */ }
    finally {
      if (pullingModelRef.current === modelId) {
        pullingModelRef.current = null;
        setPullingModel(null);
        setPullProgress(0);
        setPullStatus('');
        setPullSpeedMbs(0);
        pullSpeedRef.current = { completed: 0, ts: 0 };
        setIsCancellingPull(false);
      }
    }
  }, []);

  const handleCancelPull = useCallback(async () => {
    const modelId = pullingModelRef.current;
    if (!window.electronAPI?.ollamaCancelPullModel || !modelId) return;
    setIsCancellingPull(true);
    try {
      const res = await window.electronAPI.ollamaCancelPullModel(modelId);
      if (res?.success && res?.status) setStatus(res.status);
    } catch { /* silent */ }
    finally {
      pullingModelRef.current = null;
      setPullingModel(null);
      setPullProgress(0);
      setPullStatus('');
      setPullSpeedMbs(0);
      pullSpeedRef.current = { completed: 0, ts: 0 };
      setIsCancellingPull(false);
    }
  }, []);

  const handleDelete = useCallback(async (modelId) => {
    if (!window.electronAPI?.ollamaDeleteModel) return;
    setDeletingModelId(modelId);
    try {
      // Small delay to let the animation start
      await new Promise(r => setTimeout(r, 200));
      const res = await window.electronAPI.ollamaDeleteModel(modelId);
      if (res?.success && res?.status) {
        setStatus(res.status);
        if (ollamaModel === modelId) onOllamaModelChange('');
      }
    } catch { /* silent */ }
    finally {
      // Keep it a bit longer for smooth fade out
      setTimeout(() => setDeletingModelId(null), 300);
    }
  }, [ollamaModel, onOllamaModelChange]);

  const handleUninstall = useCallback(async () => {
    if (!window.electronAPI?.ollamaUninstall) return;
    setIsUninstalling(true);
    try {
      // Delete all installed models first
      const installedModels = status?.models || [];
      for (const m of installedModels) {
        try {
          if (window.electronAPI?.ollamaDeleteModel) {
            await window.electronAPI.ollamaDeleteModel(m.name);
          }
        } catch { /* silent per model */ }
      }
      const res = await window.electronAPI.ollamaUninstall();
      if (res?.success && res?.status) {
        setStatus(res.status);
      } else {
        await refreshStatus();
      }
    } catch { await refreshStatus(); }
    finally { setIsUninstalling(false); }
  }, [refreshStatus, status]);

  const isModelInstalled = (modelId) => {
    const id = modelId.toLowerCase();
    const names = (status?.models || []).map((m) => m.name.toLowerCase());
    return names.some((n) => {
      if (n === id) return true;
      if (n === `${id}:latest`) return true;       // Ollama appends :latest
      if (n.startsWith(`${id}:`)) return true;     // any tag
      if (id.includes(':') && n.startsWith(`${id.split(':')[0]}:`)) return true;
      if (id.startsWith('hf.co/') && n.includes(id.replace('hf.co/', ''))) return true;
      return false;
    });
  };

  // ── Loading skeleton ──────────────────────────────────────────────────────
  if (isLoading && !status) {
    return (
      <div className="space-y-3 animate-pulse">
        <div className="h-24 rounded-2xl bg-white/[0.03]" />
        <div className="h-16 rounded-2xl bg-white/[0.03]" />
      </div>
    );
  }

  // ── Not installed → delegate to OllamaInstallerPage ──────────────────────
  if (!status?.installed) {
    return (
      <OllamaInstallerPage
        onInstallComplete={(newStatus) => setStatus(newStatus)}
      />
    );
  }

  // ── Installed, not running ────────────────────────────────────────────────
  if (!status?.running) {
    return (
      <div className="space-y-3 animate-[fadeIn_220ms_ease-out]">
        <div className="flex items-center justify-between px-0.5">
          <div className="flex items-center gap-2">
            <Server className="w-4 h-4 text-violet-300 shrink-0" />
            <span className="text-sm font-semibold text-white">Ollama</span>
          </div>
          <RefreshButton onRefresh={refreshStatus} />
        </div>
        <div className="rounded-xl border border-amber-500/20 bg-amber-500/[0.05] backdrop-blur-xl p-3.5 space-y-2.5">
          <div className="flex items-start gap-2.5">
            <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <div>
              <p className="text-xs font-semibold text-amber-200 mb-0.5">Сервер не запущен</p>
              <p className="text-[11px] text-amber-200/60 leading-relaxed">
                Ollama установлен, но сервер не активен. Запустите его кнопкой ниже или вручную:
              </p>
            </div>
          </div>
          <div className="flex items-center rounded-lg bg-black/20 border border-white/[0.07] px-3 py-2">
            <code className="text-[11px] font-mono text-emerald-300 select-all">ollama serve</code>
          </div>
        </div>
        <button
          onClick={handleStartServer}
          disabled={isStarting}
          className="w-full flex items-center justify-center gap-2 h-10 rounded-xl border border-emerald-500/25 bg-emerald-500/[0.06] text-emerald-300 text-sm font-semibold transition-all duration-200 hover:bg-emerald-500/[0.12] hover:border-emerald-400/35 hover:shadow-[0_0_16px_rgba(52,211,153,0.12)] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isStarting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Server className="w-4 h-4" />}
          {isStarting ? 'Запуск...' : 'Запустить Ollama'}
        </button>
        <UninstallRow isUninstalling={isUninstalling} onUninstall={handleUninstall} />
      </div>
    );
  }

  // ── Running — model management ────────────────────────────────────────────
  return (
    <div className="space-y-4 animate-[fadeIn_220ms_ease-out]">
      {/* Status bar */}
      <div className="flex items-center justify-between rounded-xl border border-emerald-500/15 bg-emerald-500/[0.04] backdrop-blur-xl px-3.5 py-2.5">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="relative flex items-center justify-center w-5 h-5 shrink-0">
            <div className="absolute w-3 h-3 rounded-full bg-emerald-400/20 animate-ping" />
            <div className="relative w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.7)]" />
          </div>
          <div className="min-w-0">
            <span className="text-xs font-semibold text-emerald-300">Ollama активен</span>
            <span className="text-[10px] text-zinc-600 font-mono ml-2 truncate">{status?.baseUrl || 'localhost:11434'}</span>
          </div>
        </div>
        <RefreshButton onRefresh={refreshStatus} />
      </div>

      {/* Section header */}
      <div>
        <div className="flex items-center gap-2 mb-3 px-0.5">
          <Bot className="w-3.5 h-3.5 text-zinc-500 shrink-0" />
          <span className="text-[11px] font-bold tracking-widest text-zinc-500 uppercase">Модели</span>
        </div>

        {/* Model cards */}
        <div className="space-y-2">
          {OLLAMA_MODEL_OPTIONS.map((model) => (
            <ModelCard
              key={model.id}
              model={model}
              isSelected={ollamaModel === model.id && isModelInstalled(model.id)}
              isInstalled={isModelInstalled(model.id)}
              isPulling={pullingModel === model.id}
              isCancellingPull={pullingModel === model.id && isCancellingPull}
              isDeleting={deletingModelId === model.id}
              pullProgress={pullingModel === model.id ? pullProgress : 0}
              pullStatus={pullingModel === model.id ? pullStatus : ''}
              pullSpeedMbs={pullingModel === model.id ? pullSpeedMbs : 0}
              onSelect={onOllamaModelChange}
              onPull={handlePull}
              onCancelPull={handleCancelPull}
              onDelete={handleDelete}
            />
          ))}
        </div>
      </div>

      <UninstallRow isUninstalling={isUninstalling} onUninstall={handleUninstall} />
    </div>
  );
}
