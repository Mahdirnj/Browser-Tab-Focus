/**
 * Greeting sub-line resolver (IDEA-V3-004).
 *
 * Renders a small contextual line under the hero greeting. Three modes:
 *   - `none`        → hidden.
 *   - `dayContext`  → motivational micro-copy keyed off the weekday, resolved
 *                     in the user's timezone so it flips at local midnight
 *                     alongside the Clock/Greeting.
 *   - `focusEcho`   → echoes today's Daily Focus inline ("Focus: …"). Empty
 *                     when no focus is set for the current day, mirroring the
 *                     same per-day reset logic as DailyFocus.jsx.
 */

import { DAILY_FOCUS_KEY, FOCUS_DATE_KEY } from '../constants/storageKeys'
import { readJSON, readString } from './storage'

export const GREETING_SUBLINE_MODES = {
  none: 'none',
  dayContext: 'dayContext',
  focusEcho: 'focusEcho',
}

export const DEFAULT_GREETING_SUBLINE = GREETING_SUBLINE_MODES.dayContext

/** Weekday-keyed micro-copy. Index matches `Date.prototype.getDay()` (0 = Sunday). */
const DAY_CONTEXT_COPY = [
  'Enjoy your rest \u2600\uFE0F', // Sunday
  'Start the week strong \uD83D\uDCAA', // Monday
  'Keep the momentum going \u2728', // Tuesday
  'Halfway there \u26A1', // Wednesday
  'Push through to the finish \uD83C\uDFAF', // Thursday
  'Almost weekend \uD83C\uDF89', // Friday
  'Enjoy your rest \u2600\uFE0F', // Saturday
]

/**
 * Resolve the weekday (0–6) for the given timezone. Falls back to the local
 * weekday when no/invalid timezone is provided.
 */
function weekdayForTimezone(timeZone) {
  try {
    if (
      timeZone &&
      typeof Intl !== 'undefined' &&
      typeof Intl.DateTimeFormat === 'function'
    ) {
      const weekday = new Intl.DateTimeFormat('en-US', {
        timeZone,
        weekday: 'short',
      }).format(new Date())
      const map = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 }
      if (weekday in map) return map[weekday]
    }
  } catch {
    // Invalid timezone — fall through to local weekday.
  }
  return new Date().getDay()
}

/** Today's stored Daily Focus text, or '' when none is set for the current day. */
function readTodaysFocus() {
  const storedDate = readString(FOCUS_DATE_KEY, '')
  if (storedDate !== new Date().toDateString()) return ''
  const stored = readJSON(DAILY_FOCUS_KEY, null)
  const text = stored && typeof stored.text === 'string' ? stored.text.trim() : ''
  return text
}

/**
 * Resolve the sub-line text for a given mode.
 *
 * @param {string} mode      One of GREETING_SUBLINE_MODES.
 * @param {string} [timeZone] IANA timezone used for the day-context copy.
 * @returns {string} The sub-line text, or '' when nothing should render.
 */
export function resolveGreetingSubline(mode, timeZone) {
  switch (mode) {
    case GREETING_SUBLINE_MODES.dayContext:
      return DAY_CONTEXT_COPY[weekdayForTimezone(timeZone)] ?? ''
    case GREETING_SUBLINE_MODES.focusEcho: {
      const focus = readTodaysFocus()
      return focus ? `Focus: ${focus}` : ''
    }
    case GREETING_SUBLINE_MODES.none:
    default:
      return ''
  }
}
