import React, { useCallback } from 'react';
import { Clock, Ghost, FileCode2, Layers, FolderOpen } from 'lucide-react';
import pkg from '../../../package.json';
import { DeleteProjectButton, EditProjectButton } from './StartPageButtons';
import { useTiltEffect } from './StartPage_Utils/useTiltEffect';
import { useDragAndDrop } from './StartPage_Utils/useDragAndDrop';
import { notify } from '../../Shared/notificationCore_utils/notifications';
import { useLocale } from '../../Locales';

// ── Helpers ──────────────────────────────────────────────────────────────────

function formatDate(timestamp) {
  const d = new Date(timestamp);
  return d.toLocaleDateString('ru-RU', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

// ── Background ───────────────────────────────────────────────────────────────

export function PageBackground() {
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden bg-surface-0">
      {/* Dot grid — prominent */}
      <div
        className="absolute inset-0 opacity-[0.4]"
        style={{
          backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.15) 1px, transparent 1px)',
          backgroundSize: '24px 24px',
        }}
      />

      {/* Central radial fade — hides dots in center, keeps them on edges */}
      <div
        className="absolute inset-0"
        style={{ background: 'radial-gradient(ellipse 60% 50% at 50% 35%, rgba(9,9,11,0.95) 0%, transparent 100%)' }}
      />

      {/* Soft top spotlight */}
      <div className="absolute top-[-20%] left-1/2 -translate-x-1/2 w-[800px] h-[500px] rounded-full bg-white/[0.03] blur-[120px]" />

      {/* Fine grain noise */}
      <svg className="absolute inset-0 w-full h-full opacity-[0.12] mix-blend-overlay" aria-hidden="true">
        <filter id="startNoise">
          <feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="4" stitchTiles="stitch" />
        </filter>
        <rect width="100%" height="100%" filter="url(#startNoise)" />
      </svg>

      {/* Edge vignette */}
      <div
        className="absolute inset-0"
        style={{ background: 'radial-gradient(ellipse at 50% 50%, transparent 40%, rgba(9,9,11,1) 100%)' }}
      />
    </div>
  );
}

// ── Hero ──────────────────────────────────────────────────────────────────────

export function HeroSection() {
  const t = useLocale();
  return (
    <div className="flex flex-col items-center text-center mt-10 mb-14 start-fade-in relative z-10">
      <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-zinc-200 mb-3">
        {t.projects.heroTitle}
      </h1>

      <p className="text-zinc-500 text-[14px] font-medium max-w-md leading-relaxed">
        {t.projects.heroDesc}
      </p>
    </div>
  );
}

// ── Drop Zone ─────────────────────────────────────────────────────────────────

export function DropZone({ onClickOpen, onFileDrop }) {
  const t = useLocale();
  const handleInvalidFile = useCallback(() => {
    notify.error(t.projects.dropInvalid, t.projects.dropInvalidDesc, 3500);
  }, [t.projects.dropInvalid, t.projects.dropInvalidDesc]);

  const { isDragging, dragHandlers } = useDragAndDrop({
    onFileDrop,
    onInvalidFile: handleInvalidFile,
  });

  return (
    <div
      className="start-fade-in w-full max-w-[520px]"
      style={{ animationDelay: '100ms' }}
    >
      <div
        role="button"
        tabIndex={0}
        onClick={onClickOpen}
        onKeyDown={(e) => e.key === 'Enter' && onClickOpen()}
        className={[
          'relative w-full cursor-pointer select-none rounded-2xl border border-dashed',
          'transition-all duration-300 outline-none',
          isDragging
            ? 'border-white/60 bg-white/[0.06] dropzone-glow'
            : 'border-white/[0.14] bg-white/[0.02] hover:bg-white/[0.04] hover:border-white/[0.28]',
        ].join(' ')}
        {...dragHandlers}
      >
        {/* Top edge shimmer — visible while dragging */}
        <div
          className={[
            'absolute inset-x-0 top-0 h-[1px] rounded-t-2xl bg-gradient-to-r from-transparent via-white/50 to-transparent',
            'transition-opacity duration-300',
            isDragging ? 'opacity-100' : 'opacity-0',
          ].join(' ')}
        />

        <div className="flex flex-col items-center justify-center gap-3.5 py-9 px-8">
          {/* Icon */}
          <div
            className={[
              'w-13 h-13 rounded-xl flex items-center justify-center border transition-all duration-300',
              isDragging
                ? 'bg-white/[0.12] border-white/[0.25] scale-110'
                : 'bg-white/[0.04] border-white/[0.08]',
            ].join(' ')}
            style={{ width: '52px', height: '52px' }}
          >
            <FolderOpen
              className={[
                'w-6 h-6 transition-all duration-300',
                isDragging ? 'text-white' : 'text-zinc-400',
              ].join(' ')}
            />
          </div>

          {/* Labels */}
          <div className="text-center">
            <p
              className={[
                'text-[17px] font-semibold transition-colors duration-200',
                isDragging ? 'text-zinc-200' : 'text-zinc-400',
              ].join(' ')}
            >
              {isDragging ? t.projects.dropLabelDrag : t.projects.dropLabel}
            </p>
            <p
              className={[
                'text-[14px] mt-1 transition-colors duration-200',
                isDragging ? 'text-zinc-400' : 'text-zinc-600',
              ].join(' ')}
            >
              {t.projects.dropSub}
            </p>
          </div>

          {/* Format badges */}
          <div className="flex items-center gap-2">
            {['PAK', 'ZIP', 'RAR'].map((fmt) => (
              <span
                key={fmt}
                className={
                  'px-2.5 py-0.5 rounded-md text-[10px] font-bold tracking-widest uppercase ' +
                  'bg-white/[0.05] border border-white/[0.08] text-zinc-500 transition-colors duration-200'
                }
              >
                {fmt}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Projects separator ───────────────────────────────────────────────────────

export function ProjectsSeparator({ count, loading }) {
  const t = useLocale();
  return (
    <div className="w-full flex items-center gap-4 my-14 start-fade-in relative z-10" style={{ animationDelay: '150ms' }}>
      <div className="flex-1 relative h-[1px]">
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-white/5" />
      </div>

      <div className="flex items-center gap-2.5 text-[12px] font-bold text-zinc-300 uppercase tracking-widest bg-surface-2/90 backdrop-blur-md border border-white/[0.08] px-5 py-2.5 rounded-full shadow-[0_4px_24px_-4px_rgba(0,0,0,0.6)]">
        <Clock className="w-4 h-4 text-zinc-400 opacity-80" />
        <span>{t.projects.recentProjects}</span>
        {!loading && count > 0 && (
          <span className="ml-1 px-2 py-0.5 rounded-md bg-white/[0.08] border border-white/[0.1] text-zinc-300">
            {count}
          </span>
        )}
      </div>

      <div className="flex-1 relative h-[1px]">
        <div className="absolute inset-0 bg-gradient-to-l from-transparent via-white/20 to-white/5" />
      </div>
    </div>
  );
}

// ── Loading / Empty ──────────────────────────────────────────────────────────

export function LoadingState() {
  const t = useLocale();
  return (
    <div className="flex flex-col items-center gap-4 py-16">
      <div className="relative w-10 h-10">
        <div className="absolute inset-0 border-2 border-white/10 rounded-full" />
        <div className="absolute inset-0 border-2 border-white/50 rounded-full border-t-transparent animate-spin" />
      </div>
      <span className="text-zinc-500 text-[14px] font-medium tracking-wide">{t.projects.syncing}</span>
    </div>
  );
}

export function EmptyState() {
  const t = useLocale();
  return (
    <div className="flex flex-col items-center justify-center py-16 start-fade-in" style={{ animationDelay: '200ms' }}>
      <Ghost className="w-8 h-8 text-zinc-700 mb-5" />
      <h3 className="text-zinc-500 font-semibold text-[17px] mb-2 tracking-wide">{t.projects.emptyTitle}</h3>
      <p className="text-zinc-700 text-[14px] leading-relaxed text-center max-w-[280px]">
        {t.projects.emptyDesc}
      </p>
    </div>
  );
}

// ── Project card ─────────────────────────────────────────────────────────────

export function ProjectCard({ project, index, onLoad, onDelete, onEdit }) {
  const { ref, onMouseMove, onMouseLeave } = useTiltEffect({ maxTilt: 8, scale: 1.02 });
  const pakName = project.pakPath ? project.pakPath.split(/[\\/]/).pop() : 'Файл не найден';
  const delay = index < 12 ? index * 50 : 0;

  return (
    <div className="start-card-appear h-full" style={{ animationDelay: `${delay}ms` }}>
      <div
        ref={ref}
        onClick={() => onLoad(project)}
        onMouseMove={onMouseMove}
        onMouseLeave={onMouseLeave}
        className="group relative cursor-pointer h-full"
        style={{ willChange: 'transform' }}
      >
        {/* Hover glow — white/neutral */}
        <div className="absolute -inset-2 rounded-[24px] blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-700 z-0 bg-white/[0.03]" />

        {/* Glass surface — translucent glass card */}
        <div className="absolute inset-0 z-0 rounded-[20px] bg-white/[0.04] backdrop-blur-2xl border border-white/[0.1] shadow-[0_2px_16px_rgba(0,0,0,0.2)] transition-all duration-500 group-hover:bg-white/[0.06] group-hover:border-white/[0.14] group-hover:shadow-[0_8px_32px_rgba(0,0,0,0.3)]" />

        {/* Interactive cursor spotlight */}
        <div
          className="absolute inset-0 rounded-[20px] opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-[1] pointer-events-none"
          style={{ background: 'radial-gradient(circle 200px at var(--mouse-x, 50%) var(--mouse-y, 50%), rgba(255,255,255,0.04), transparent)' }}
        />

        {/* Top edge highlight */}
        <div className="absolute inset-x-0 top-0 h-[1px] bg-gradient-to-r from-transparent via-white/[0.1] to-transparent opacity-50 group-hover:opacity-90 transition-opacity duration-500 rounded-t-[20px] z-[1]" />

        {/* Content */}
        <div className="relative h-full flex flex-col p-5 rounded-[20px] overflow-hidden z-10">
          <div className="flex items-start justify-between gap-3 mb-4">
            <div className="w-11 h-11 rounded-xl bg-white/[0.06] border border-white/[0.1] flex items-center justify-center transition-all duration-500 group-hover:border-white/[0.2] group-hover:bg-white/[0.1]">
              <Layers className="w-5 h-5 text-zinc-500 group-hover:text-white transition-colors duration-500" />
            </div>
            <div className="pt-0.5 relative z-20 flex items-center gap-1">
              <EditProjectButton onClick={(e) => onEdit(e, project)} />
              <DeleteProjectButton onClick={(e) => onDelete(e, project)} />
            </div>
          </div>

          <div className="flex-1 flex flex-col justify-end">
            <h4 className="text-zinc-200 font-semibold text-[15px] leading-snug mb-1.5 line-clamp-2 group-hover:text-white transition-colors duration-200">
              {project.name}
            </h4>

            <div className="flex items-center gap-1.5 text-zinc-500 text-[13px] font-medium mb-3">
              <FileCode2 className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate">{pakName}</span>
            </div>

            <div className="h-px w-full bg-gradient-to-r from-white/[0.06] to-transparent mb-3" />

            <div className="flex items-center gap-1.5 text-[12px] text-zinc-500 font-medium">
              <Clock className="w-3.5 h-3.5 opacity-70" />
              <span>{formatDate(project.lastModified)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Footer ───────────────────────────────────────────────────────────────────

export function Footer() {
  const currentYear = new Date().getFullYear();
  const appVersion = pkg?.version || '0.0.0';
  return (
    <div className="relative z-20 shrink-0 border-t border-white/[0.04] bg-surface-0/80 backdrop-blur-xl">
      <div className="flex items-center justify-between px-8 py-3">
        {/* Left — copyright */}
        <p className="text-[12px] font-medium tracking-wide text-zinc-600 select-none">
          &copy; {currentYear} ANICKON. Все права защищены.
        </p>

        {/* Right — version */}
        <p className="text-[12px] font-medium tracking-wide text-zinc-600 select-none">
          Версия {appVersion}
        </p>
      </div>
    </div>
  );
}
