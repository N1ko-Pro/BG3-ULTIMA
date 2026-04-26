// ─── Notification Store — persistent in-memory history ──────────────────────
// Keeps a running log of all dispatched notifications so the NotificationCenter
// can display a bell-icon history dropdown.

const MAX_ITEMS = 50;
let notifications = [];
let listeners = new Set();

function emit() {
  listeners.forEach((fn) => fn());
}

export const notificationStore = {
  getAll: () => notifications,

  add(notification) {
    // Only store error notifications in the history center
    if (notification.type !== 'error') return;

    // Deduplicate: if same title+message already exists, just update timestamp
    const existingIdx = notifications.findIndex(
      (n) => n.title === notification.title && n.message === notification.message
    );
    if (existingIdx !== -1) {
      notifications = [
        { ...notifications[existingIdx], timestamp: Date.now(), read: false },
        ...notifications.slice(0, existingIdx),
        ...notifications.slice(existingIdx + 1),
      ];
      emit();
      return;
    }
    notifications = [{ ...notification, read: false, timestamp: Date.now() }, ...notifications].slice(0, MAX_ITEMS);
    emit();
  },

  markAllRead() {
    notifications = notifications.map((n) => (n.read ? n : { ...n, read: true }));
    emit();
  },

  remove(id) {
    notifications = notifications.filter((n) => n.id !== id);
    emit();
  },

  clear() {
    notifications = [];
    emit();
  },

  subscribe(fn) {
    listeners.add(fn);
    return () => listeners.delete(fn);
  },
};
