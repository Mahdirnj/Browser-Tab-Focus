import rawQuotes from './quotes.json'

/**
 * All quotes from the bundled collection.
 * Each entry: { text: string, author: string }
 */
export const quotes = rawQuotes.quotes.map((q) => ({
  text: q.text,
  author: q.from,
}))

const MS_PER_DAY = 86_400_000

/**
 * Day index that advances at local midnight for the given timezone.
 *
 * We resolve the calendar date (year/month/day) in the target timezone via
 * `Intl.DateTimeFormat`, then anchor it to UTC midnight to derive a stable
 * integer day number. This keeps the daily quote in step with the rest of
 * the app (Clock, Greeting, DailyFocus), which are all timezone-aware,
 * instead of rolling over on UTC days.
 *
 * Falls back to the UTC-based index when no/invalid timezone is supplied.
 *
 * @param {string} [timeZone] IANA timezone (e.g. "America/New_York")
 * @returns {number}
 */
function getLocalDayIndex(timeZone) {
  try {
    if (
      timeZone &&
      typeof Intl !== 'undefined' &&
      typeof Intl.DateTimeFormat === 'function'
    ) {
      const parts = new Intl.DateTimeFormat('en-US', {
        timeZone,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
      }).formatToParts(new Date())

      const get = (type) => parts.find((part) => part.type === type)?.value
      const year = get('year')
      const month = get('month')
      const day = get('day')

      if (year && month && day) {
        const ms = Date.parse(`${year}-${month}-${day}T00:00:00Z`)
        if (!Number.isNaN(ms)) return Math.floor(ms / MS_PER_DAY)
      }
    }
  } catch {
    // Invalid timezone — fall through to the UTC-based index.
  }
  return Math.floor(Date.now() / MS_PER_DAY)
}

/**
 * Returns the quote for today using a timezone-local day-seeded index.
 * Cycles back to the start after all quotes are shown.
 *
 * @param {string} [timeZone] IANA timezone used to determine "today".
 */
export function getTodayQuote(timeZone) {
  const length = quotes.length
  if (!length) return undefined
  const dayIndex = getLocalDayIndex(timeZone)
  // Normalize into range even if the index is ever negative.
  return quotes[((dayIndex % length) + length) % length]
}
