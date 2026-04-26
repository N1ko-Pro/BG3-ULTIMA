/**
 * Auto-resize a textarea element to fit its content.
 */
export function autoResize(el) {
  if (!el) return;
  el.style.height = 'auto';
  el.style.height = `${el.scrollHeight}px`;
}
