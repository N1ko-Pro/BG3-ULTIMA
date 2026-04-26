import React, { useState, useEffect, useRef } from 'react';
import { Pencil, User, Type, Check } from 'lucide-react';
import Modal from '../../../Core/design/ModalCore';
import Field from './ModalField';
import { useLocale } from '../../../Locales';

/**
 * Allows editing mod name and author of an existing project.
 */
export function ProjectEditModal({ isOpen, project, existingProjectNames = [], onConfirm, onCancel }) {
  const t = useLocale();
  const [modName, setModName] = useState('');
  const [author, setAuthor] = useState('');
  const [modNameError, setModNameError] = useState('');
  const [authorError, setAuthorError] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const nameInputRef = useRef(null);

  useEffect(() => {
    if (isOpen && project) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setModName(project.name || '');
      setAuthor(project.author || '');
      setModNameError('');
      setAuthorError('');
      setSubmitted(false);
      setTimeout(() => nameInputRef.current?.focus(), 120);
    }
  }, [isOpen, project]);

  const validateModName = (value) => {
    if (!value.trim()) return t.projects.editNameRequired;
    // Allow the same name as current project
    const others = existingProjectNames.filter((n) => n !== project?.name);
    if (others.includes(value.trim())) {
      return t.projects.editNameDuplicate;
    }
    return '';
  };

  const validateAuthor = (value) => {
    if (!value.trim()) return t.projects.editAuthorRequired;
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
      title={t.projects.editTitle}
      subtitle={t.projects.editSubtitle}
      icon={Pencil}
      iconColorClass="text-zinc-300"
      iconBgClass="bg-surface-3"
      iconBorderClass="border-white/[0.1]"
      closeOnOverlayClick={false}
      showCloseIcon
      maxWidthClass="max-w-[440px]"
      footer={
        <div className="flex items-center gap-3 w-full">
          <button
            onClick={onCancel}
            className="flex-1 px-4 py-2.5 text-[13px] font-semibold bg-surface-3 hover:bg-surface-4 text-zinc-300 rounded-xl transition-all duration-200 border border-white/[0.08] hover:border-white/[0.14] active:scale-[0.98]"
          >
            {t.projects.cancelButton}
          </button>
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
            <Check className="w-4 h-4 shrink-0 text-zinc-600 group-hover:text-zinc-800 transition-colors duration-200" />
            {t.projects.editSave}
          </button>
        </div>
      }
    >
      <div className="flex flex-col gap-4">
        <Field
          ref={nameInputRef}
          icon={Type}
          label={t.projects.editModNameLabel}
          value={modName}
          onChange={handleModNameChange}
          error={modNameError}
          onEnter={handleSubmit}
          placeholder={t.projects.editModNamePlaceholder}
        />
        <Field
          icon={User}
          label={t.projects.editAuthorLabel}
          value={author}
          onChange={handleAuthorChange}
          error={authorError}
          onEnter={handleSubmit}
          placeholder={t.projects.editAuthorPlaceholder}
        />
      </div>
    </Modal>
  );
}
