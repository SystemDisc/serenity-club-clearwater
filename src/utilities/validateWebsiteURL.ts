/** Keep editorial links navigable without allowing executable or protocol-relative addresses. */
export function validateWebsiteURL(value: unknown): true | string {
  if (value === null || value === undefined || value === '') return true
  if (typeof value !== 'string' || /[\u0000-\u0020\\]/.test(value))
    return 'Use a complete https:// address or a club page such as /events.'
  if (/^\/(?!\/)/.test(value) || /^#[\w-]+$/.test(value)) return true
  try {
    const url = new URL(value)
    if (['https:', 'http:', 'mailto:', 'tel:'].includes(url.protocol)) return true
  } catch {
    /* Return the same actionable field error for invalid addresses. */
  }
  return 'Use a complete https:// address, email link, phone link, or club page such as /events.'
}
