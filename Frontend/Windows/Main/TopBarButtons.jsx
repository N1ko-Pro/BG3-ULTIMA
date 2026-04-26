import React from 'react';
import { Languages, Package, Settings, DownloadCloud, UploadCloud } from 'lucide-react';
import { useLocale } from '../../Locales';

export function AutoTranslateButton({ disabled, isTranslating, onOpen, className = '' }) {
  const t = useLocale();
  return (
    <button
      onClick={onOpen}
      disabled={disabled || isTranslating}
      className={`group relative flex h-[52px] items-center justify-center gap-3 px-7 rounded-2xl border transition-all duration-200 overflow-hidden shrink-0 ${className} ${
        disabled || isTranslating
          ? 'bg-surface-2/50 border-white/[0.04] opacity-40 cursor-not-allowed'
          : 'bg-violet-500/[0.07] backdrop-blur-xl border-violet-400/[0.15] hover:bg-violet-500/[0.12] hover:border-violet-400/[0.25] hover:shadow-[0_0_24px_rgba(167,139,250,0.12)] active:scale-[0.97]'
      }`}
    >
      <span className="absolute inset-0 w-full h-full bg-gradient-to-r from-violet-400/0 via-violet-400/[0.05] to-transparent -translate-x-full group-hover:animate-[shimmer_2s_infinite]" />
      <Languages
        className={`relative z-10 w-5 h-5 transition-all duration-200 ${
          disabled || isTranslating
            ? 'text-white/20'
            : 'text-violet-300/80 group-hover:text-violet-200 group-hover:-translate-y-0.5'
        }`}
      />
      <span
        className={`relative z-10 text-[14px] font-semibold tracking-wide whitespace-nowrap ${
          disabled || isTranslating ? 'text-white/20' : 'text-zinc-200 group-hover:text-white'
        }`}
      >
        {t.editor.autoTranslate}
      </span>
    </button>
  );
}

export function PackButton({ onPack }) {
  const t = useLocale();
  return (
    <button
      onClick={onPack}
      className="group relative flex h-[42px] items-center justify-center gap-2.5 px-5 rounded-xl bg-blue-500/[0.1] backdrop-blur-xl border border-blue-400/[0.2] transition-all duration-200 hover:bg-blue-500/[0.16] hover:border-blue-400/[0.32] hover:shadow-[0_0_24px_rgba(96,165,250,0.12)] overflow-hidden active:scale-[0.97]"
    >
      <span className="absolute inset-0 w-full h-full bg-gradient-to-r from-blue-400/0 via-blue-400/[0.06] to-transparent -translate-x-full group-hover:animate-[shimmer_2s_infinite]" />
      <Package className="relative z-10 w-4 h-4 text-blue-300/80 group-hover:text-blue-200 transition-all duration-200 group-hover:-translate-y-0.5" />
      <span className="relative z-10 text-[13px] font-semibold text-blue-200/80 tracking-wide group-hover:text-blue-100">{t.editor.pack}</span>
    </button>
  );
}

export function SettingsButton({ onSettings }) {
  const t = useLocale();
  return (
    <button
      onClick={onSettings}
      className="group relative flex h-[42px] w-[42px] items-center justify-center rounded-xl bg-white/[0.06] backdrop-blur-xl border border-white/[0.12] transition-all duration-200 hover:bg-white/[0.1] hover:border-white/[0.2] hover:shadow-[0_0_20px_rgba(255,255,255,0.04)] active:scale-[0.95] overflow-hidden"
      title={t.editor.settings}
    >
      <span className="absolute inset-0 w-full h-full bg-gradient-to-r from-white/0 via-white/[0.04] to-transparent -translate-x-full group-hover:animate-[shimmer_2s_infinite]" />
      <Settings className="relative z-10 w-4 h-4 text-zinc-300 group-hover:text-white transition-all duration-500 group-hover:rotate-90" />
    </button>
  );
}

function ExportButton({ onExport }) {
  const t = useLocale();
  return (
    <button
      onClick={onExport}
      className="group relative flex h-[42px] items-center justify-center gap-2.5 px-5 rounded-xl bg-white/[0.06] backdrop-blur-xl border border-white/[0.12] transition-all duration-200 hover:bg-white/[0.1] hover:border-white/[0.2] hover:shadow-[0_0_20px_rgba(255,255,255,0.04)] overflow-hidden active:scale-[0.97]"
      title={t.editor.exportTitle}
    >
      <span className="absolute inset-0 w-full h-full bg-gradient-to-r from-blue-400/0 via-blue-400/[0.05] to-transparent -translate-x-full group-hover:animate-[shimmer_2s_infinite]" />
      <DownloadCloud className="relative z-10 w-4 h-4 text-blue-300/80 group-hover:text-blue-200 group-hover:translate-y-0.5 transition-all duration-200" />
      <span className="relative z-10 text-[13px] font-semibold text-zinc-200 group-hover:text-white tracking-wide">
        {t.editor.export}
      </span>
    </button>
  );
}

function ImportButton({ onImport }) {
  const t = useLocale();
  return (
    <button
      onClick={onImport}
      className="group relative flex h-[42px] items-center justify-center gap-2.5 px-5 rounded-xl bg-white/[0.06] backdrop-blur-xl border border-white/[0.12] transition-all duration-200 hover:bg-white/[0.1] hover:border-white/[0.2] hover:shadow-[0_0_20px_rgba(255,255,255,0.04)] overflow-hidden active:scale-[0.97]"
      title={t.editor.importTitle}
    >
      <span className="absolute inset-0 w-full h-full bg-gradient-to-r from-emerald-400/0 via-emerald-400/[0.05] to-transparent -translate-x-full group-hover:animate-[shimmer_2s_infinite]" />
      <UploadCloud className="relative z-10 w-4 h-4 text-emerald-300/80 group-hover:text-emerald-200 group-hover:-translate-y-0.5 transition-all duration-200" />
      <span className="relative z-10 text-[13px] font-semibold text-zinc-200 group-hover:text-white tracking-wide">
        {t.editor.import}
      </span>
    </button>
  );
}

export function XmlActionGroup({ onImport, onExport }) {
  return (
    <div className="relative flex items-center justify-center gap-2 px-2 mt-2 mb-2">
      <div className="absolute -top-[14px] left-4 right-4 flex items-center justify-center pointer-events-none">
        <div className="w-full h-2 border-t border-l border-white/[0.1] rounded-tl-lg" />
        <span className="text-[9px] text-zinc-600 font-bold px-1.5 tracking-widest leading-none bg-surface-1">
          XML
        </span>
        <div className="w-full h-2 border-t border-r border-white/[0.1] rounded-tr-lg" />
      </div>
      <ExportButton onExport={onExport} />
      <ImportButton onImport={onImport} />
    </div>
  );
}

export function ToolsGroup({ children, className = '', ...rest }) {
  return (
    <div className={`relative flex items-center gap-2 px-2 mt-2 mb-2 ${className}`} {...rest}>
      <div className="absolute -top-[14px] left-4 right-4 flex items-center justify-center pointer-events-none">
        <div className="w-full h-2 border-t border-l border-white/[0.1] rounded-tl-lg" />
        <span className="text-[9px] text-zinc-600 font-bold px-1.5 tracking-widest leading-none bg-surface-1">
          TOOLS
        </span>
        <div className="w-full h-2 border-t border-r border-white/[0.1] rounded-tr-lg" />
      </div>
      {children}
    </div>
  );
}
