import React, { useState, useEffect, useRef } from 'react';
import { PackageOpen, User, Type, FolderPlus } from 'lucide-react';
import Modal from '../../../Core/design/ModalCore';
import Field from './ModalField';

const DEFAULT_AUTHOR = 'Переводчик';

/**
 * Shown when a new mod file is opened.
 * Collects mod name (pre-filled with _RU) and translation author.
 * Validates uniqueness of the mod name against existingProjectNames.
 */
export function ProjectInitModal({ isOpen, defaultModName, existingProjectNames = [], onConfirm, onCancel }) {
  const [modName, setModName] = useState('');
  const [author, setAuthor] = useState(DEFAULT_AUTHOR);
  const [modNameError, setModNameError] = useState('');
  const [authorError, setAuthorError] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const nameInputRef = useRef(null);

  // Reset state whenever the modal opens with a new defaultModName
  useEffect(() => {
    if (isOpen) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setModName(defaultModName || '');
      setAuthor(DEFAULT_AUTHOR);
      setModNameError('');
      setAuthorError('');
      setSubmitted(false);
      // Focus name field after animation
      setTimeout(() => nameInputRef.current?.focus(), 120);
    }
  }, [isOpen, defaultModName]);

  const validateModName = (value) => {
    if (!value.trim()) return 'Имя мода обязательно для заполнения';
    if (existingProjectNames.includes(value.trim())) {
      return 'Проект с таким именем уже существует — измените имя мода';
    }
    return '';
  };

  const validateAuthor = (value) => {
    if (!value.trim()) return 'Укажите автора перевода';
    return '';
  };

  const handleSubmit = () => {
    setSubmitted(true);
    const nameErr = validateModName(modName);
    const authErr = validateAuthor(author);
    setModNameError(nameErr);
    setAuthorError(authErr);
    if (nameErr || authErr) return;
    onConfirm({ modName: modName.trim(), author: author.trim() });
  };

  const handleModNameChange = (v) => {
    const filtered = v.replace(/[\u0400-\u04FF]/g, '');
    setModName(filtered);
    if (submitted) setModNameError(validateModName(filtered));
  };

  const handleAuthorChange = (v) => {
    setAuthor(v);
    if (submitted) setAuthorError(validateAuthor(v));
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onCancel}
      title="Новый проект"
      subtitle="Заполните информацию о переводе"
      icon={PackageOpen}
      iconColorClass="text-zinc-300"
      iconBgClass="bg-surface-3"
      iconBorderClass="border-white/[0.1]"
      closeOnOverlayClick={false}
      disableClose={false}
      showCloseIcon
      maxWidthClass="max-w-[440px]"
      footer={
        <div className="flex items-center gap-3 w-full">
          {/* Cancel — muted ghost */}
          <button
            onClick={onCancel}
            className="px-4 py-2.5 text-[13px] font-medium text-zinc-500 hover:text-zinc-300 rounded-xl transition-all duration-200 hover:bg-white/[0.05] active:scale-[0.97] focus:outline-none"
          >
            Отмена
          </button>

          {/* Create — solid white primary */}
          <button
            onClick={handleSubmit}
            className={[
              'group relative flex-1 flex items-center justify-center gap-2 px-5 py-2.5',
              'text-[13px] font-semibold text-zinc-900 rounded-xl',
              'bg-white hover:bg-zinc-100',
              'shadow-[0_2px_16px_rgba(255,255,255,0.08)]',
              'hover:shadow-[0_6px_28px_rgba(255,255,255,0.13)]',
              'active:scale-[0.97] active:shadow-none active:bg-zinc-200',
              'transition-all duration-200 focus:outline-none',
            ].join(' ')}
          >
            <FolderPlus className="w-4 h-4 shrink-0 text-zinc-600 group-hover:text-zinc-800 transition-colors duration-200" />
            Создать проект
          </button>
        </div>
      }
    >
      <div className="flex flex-col gap-4">
        {/* Mod name */}
        <Field
          ref={nameInputRef}
          icon={Type}
          label="Имя мода"
          value={modName}
          onChange={handleModNameChange}
          error={modNameError}
          onEnter={handleSubmit}
          placeholder="Название_RU"
        />

        {/* Author */}
        <Field
          icon={User}
          label="Автор перевода"
          value={author}
          onChange={handleAuthorChange}
          error={authorError}
          onEnter={handleSubmit}
          placeholder="Имя переводчика"
        />
      </div>
    </Modal>
  );
}
