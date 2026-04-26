import { notificationStore } from './notificationStore';

const dispatch = (type, title, message, duration) => {
  const id = crypto.randomUUID();
  const detail = { id, type, title, message, duration };

  // Push only warnings and errors to persistent store (for NotificationCenter history)
  if (type === 'warning' || type === 'error') {
    notificationStore.add(detail);
  }

  // Dispatch live toast (existing behaviour)
  window.dispatchEvent(new CustomEvent('app-notification', { detail }));
};

export const notify = {
  success: (title, message, duration = 3000) => dispatch('success', title, message, duration),
  info: (title, message, duration = 3000) => dispatch('info', title, message, duration),
  warning: (title, message, duration = 4000) => dispatch('warning', title, message, duration),
  error: (title, message, duration = 5000) => dispatch('error', title, message, duration),
};
