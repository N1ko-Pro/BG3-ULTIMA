export function hasText(value) {
  return typeof value === 'string' && value.trim().length > 0;
}
