import React from 'react';
import { Trash2 } from 'lucide-react';
import Modal from '../../../Core/design/ModalCore';
import { useLocale } from '../../../Locales';

export function DeleteConfirmModal({ project, onConfirm, onCancel }) {
  const t = useLocale();
  return (
    <Modal
      isOpen={!!project}
      onClose={onCancel}
      title={t.projects.deleteTitle}
      subtitle={t.projects.deleteSubtitle}
      icon={Trash2}
      iconColorClass="text-red-400"
      iconBgClass="bg-red-500/[0.1]"
      iconBorderClass="border-red-500/20"
      closeOnOverlayClick={true}
      showCloseIcon
      footer={
        <div className="flex items-center gap-3 w-full">
          <button
            onClick={onCancel}
            className="flex-1 px-4 py-2.5 text-[13px] font-semibold bg-surface-3 hover:bg-surface-4 text-zinc-300 rounded-xl transition-all duration-200 border border-white/[0.08] hover:border-white/[0.14] active:scale-[0.98]"
          >
            {t.projects.cancelButton}
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 px-4 py-2.5 text-[13px] font-semibold bg-red-500/[0.12] hover:bg-red-500/[0.2] text-red-300 rounded-xl transition-all duration-200 border border-red-500/25 hover:border-red-500/40 flex items-center justify-center gap-2 active:scale-[0.98]"
          >
            <Trash2 className="w-4 h-4" />
            <span>{t.projects.deleteConfirm}</span>
          </button>
        </div>
      }
    >
      <p className="text-zinc-300 text-sm leading-relaxed">
        {t.projects.deleteBody(project?.name)}
      </p>
    </Modal>
  );
}
