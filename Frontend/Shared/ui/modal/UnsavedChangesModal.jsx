import React, { useState } from 'react';
import { AlertTriangle, Save, Trash } from 'lucide-react';
import Modal from '../../../Core/design/ModalCore';

export default function UnsavedChangesModal({ isOpen, type, onClose, onDiscardAndClose, onSaveAndClose }) {
  const [isSaving, setIsSaving] = useState(false);

  const handleSaveAndClose = async () => {
    setIsSaving(true);
    try {
      if (onSaveAndClose) {
        await onSaveAndClose(type);
      }
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Несохранённые изменения"
      subtitle={type === 'app' ? 'Вы действительно хотите выйти?' : 'Вы действительно хотите закрыть проект?'}
      icon={AlertTriangle}
      iconColorClass="text-red-400"
      iconBgClass="bg-red-500/[0.1]"
      iconBorderClass="border-red-500/20"
      closeOnOverlayClick={false}
      footer={
        <div className="flex items-center justify-between w-full gap-3">
          <button
            onClick={() => onDiscardAndClose(type)}
            disabled={isSaving}
            className="px-5 py-2.5 text-[13px] font-semibold bg-red-500/[0.12] hover:bg-red-500/[0.2] text-red-300 rounded-xl transition-all duration-200 border border-red-500/25 hover:border-red-500/40 flex items-center gap-2 disabled:opacity-50 active:scale-95"
          >
            <Trash className="w-4 h-4" />
            <span>Не сохранять</span>
          </button>

          <button
            onClick={handleSaveAndClose}
            disabled={isSaving}
            className="px-5 py-2.5 text-[13px] font-semibold bg-surface-3 hover:bg-surface-4 text-zinc-200 rounded-xl transition-all duration-200 border border-white/[0.08] hover:border-white/[0.14] flex items-center gap-2 disabled:opacity-50 active:scale-95"
          >
            <Save className="w-4 h-4" />
            <span>Сохранить и {type === 'app' ? 'выйти' : 'закрыть'}</span>
          </button>
        </div>
      }
      showCloseIcon
    >
      <p className="text-zinc-300 text-sm leading-relaxed">
        В проекте есть несохранённые изменения.
        <br />
        Пожалуйста, <strong>сохраните</strong> их перед тем, как{' '}
        {type === 'app' ? 'закрыть приложение' : 'закрыть проект'}.
      </p>
    </Modal>
  );
}
