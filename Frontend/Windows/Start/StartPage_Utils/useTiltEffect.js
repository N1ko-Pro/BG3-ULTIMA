import { useRef, useCallback } from 'react';

export function useTiltEffect({ maxTilt = 8, scale = 1.02, perspective = 1000 } = {}) {
  const ref = useRef(null);

  const handleMouseMove = useCallback((e) => {
    const el = ref.current;
    if (!el) return;

    const rect = el.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    const rotateY = ((e.clientX - centerX) / (rect.width / 2)) * maxTilt;
    const rotateX = -((e.clientY - centerY) / (rect.height / 2)) * maxTilt;

    const px = ((e.clientX - rect.left) / rect.width * 100).toFixed(0);
    const py = ((e.clientY - rect.top) / rect.height * 100).toFixed(0);

    el.style.transition = 'transform 0.15s ease-out';
    el.style.transform = `perspective(${perspective}px) rotateX(${rotateX.toFixed(1)}deg) rotateY(${rotateY.toFixed(1)}deg) scale3d(${scale},${scale},${scale})`;
    el.style.setProperty('--mouse-x', `${px}%`);
    el.style.setProperty('--mouse-y', `${py}%`);
  }, [maxTilt, scale, perspective]);

  const handleMouseLeave = useCallback(() => {
    const el = ref.current;
    if (!el) return;
    el.style.transition = 'transform 0.6s cubic-bezier(0.16, 1, 0.3, 1)';
    el.style.transform = `perspective(${perspective}px) rotateX(0deg) rotateY(0deg) scale3d(1,1,1)`;
  }, [perspective]);

  return { ref, onMouseMove: handleMouseMove, onMouseLeave: handleMouseLeave };
}
