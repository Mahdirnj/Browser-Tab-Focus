/**
 * Returns the user's local IANA timezone string (e.g. "America/New_York").
 * Falls back to "UTC" if the Intl API is unavailable.
 */
export function getDefaultTimezone() {
  if (typeof Intl !== 'undefined' && typeof Intl.DateTimeFormat === 'function') {
    return Intl.DateTimeFormat().resolvedOptions().timeZone
  }
  return 'UTC'
}
