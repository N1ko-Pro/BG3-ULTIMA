import React from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';

export default function ModalCore({
  isOpen,
  onClose,
  title,
  subtitle,
  icon: Icon,
  iconColorClass = 'text-zinc-300',
  iconBgClass = 'bg-surface-3',
  iconBorderClass = 'border-white/[0.08]',
  children,
  footer,
  maxWidthClass = 'max-w-md',
  closeOnOverlayClick = true,
  showCloseIcon = false,
  disableClose = false,
  overlayClassName = '',
  panelClassName = '',
  headerClassName = '',
  bodyClassName = '',
  footerClassName = '',
  titleClassName = '',
  subtitleClassName = '',
  closeButtonClassName = '',
}) {
  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4" role="dialog" aria-modal="true">
      <div
        className={`absolute inset-0 animate-[modalOverlayIn_0.2s_ease-out_both] select-none ${overlayClassName}`}
        style={{
          background: 'radial-gradient(ellipse 56% 66% at 50% 50%, rgba(0,0,0,0.90) 0%, rgba(0,0,0,0.90) 28%, rgba(0,0,0,0.42) 60%, rgba(0,0,0,0.0) 82%)',
          backdropFilter: 'blur(10px)',
        }}
        onClick={closeOnOverlayClick && !disableClose ? onClose : undefined}
      />

      <div
        className={`relative w-full ${maxWidthClass} rounded-2xl overflow-hidden animate-[modalPanelIn_0.25s_cubic-bezier(0.16,1,0.3,1)_both] ${panelClassName}`}
      >
        {/* Glass surface */}
        <div className="absolute inset-0 bg-surface-2/98 backdrop-blur-2xl border border-white/[0.08] rounded-2xl shadow-[0_24px_64px_rgba(0,0,0,0.5)]" />
        <div className="absolute inset-x-0 top-0 h-[1px] bg-gradient-to-r from-transparent via-white/[0.12] to-transparent rounded-t-2xl" />

        {/* Content wrapper */}
        <div className="relative z-10 flex flex-col">
          {(title || subtitle) && (
            <div className={`p-6 border-b border-white/[0.06] flex items-center gap-4 ${headerClassName}`}>
              {Icon && (
                <div
                  className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border transition-all duration-300 ${iconBgClass} ${iconBorderClass}`}
                >
                  <Icon className={`w-5 h-5 ${iconColorClass}`} />
                </div>
              )}
              <div>
                {title && <h2 className={`text-[17px] font-semibold text-zinc-100 tracking-wide ${titleClassName}`}>{title}</h2>}
                {subtitle && <p className={`text-[13px] text-zinc-500 mt-0.5 ${subtitleClassName}`}>{subtitle}</p>}
              </div>
              {showCloseIcon && onClose && (
                <button
                  type="button"
                  onClick={onClose}
                  disabled={disableClose}
                  className={`absolute right-4 top-4 w-7 h-7 text-zinc-600 hover:text-zinc-200 transition-all duration-200 rounded-full flex items-center justify-center hover:bg-white/[0.08] disabled:cursor-not-allowed disabled:opacity-40 ${closeButtonClassName}`}
                  aria-label="Закрыть"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          )}

          <div className={`p-6 space-y-4 select-text ${bodyClassName}`}>{children}</div>

          {footer && (
            <div className={`p-4 border-t border-white/[0.06] flex items-center justify-end gap-3 ${footerClassName}`}>
              {footer}
            </div>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
}
