import React, { useState, useEffect, useRef, useCallback } from 'react';
import NotifPopup from './ui/popup/NotifPopup';

export default function NotificationCore() {
  const [notifications, setNotifications] = useState([]);
  const timersRef = useRef(new Map());

  const removeNotification = useCallback((id) => {
    // Phase 1: mark as exiting to trigger exit animation
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, exiting: true } : n))
    );
    // Phase 2: actually remove after animation completes
    const exitTimer = setTimeout(() => {
      timersRef.current.delete(id);
      setNotifications((prev) => prev.filter((n) => n.id !== id));
    }, 400);
    timersRef.current.set(`exit_${id}`, exitTimer);
  }, []);

  useEffect(() => {
    const handleNotify = (e) => {
      const { id, type, title, message, duration } = e.detail;
      setNotifications((prev) => [...prev, { id, type, title, message, duration, exiting: false }]);

      if (duration) {
        const timerId = setTimeout(() => {
          removeNotification(id);
        }, duration);
        timersRef.current.set(id, timerId);
      }
    };

    window.addEventListener('app-notification', handleNotify);
    const timers = timersRef.current;
    return () => {
      window.removeEventListener('app-notification', handleNotify);
      timers.forEach(clearTimeout);
      timers.clear();
    };
  }, [removeNotification]);

  return (
    <div className="fixed top-28 right-6 z-[9999] flex flex-col gap-3 items-end pointer-events-none">
      {notifications.map((n) => (
        <NotifPopup key={n.id} notification={n} onRemove={removeNotification} />
      ))}
    </div>
  );
}
