/**
 * Calendar registry + formatting helpers.
 *
 * The browser's `Intl.DateTimeFormat` natively supports a wide set of
 * calendars via the unicode `-u-ca-` extension. Conversions are done by
 * ICU under the hood and are accurate.
 *
 * Each entry below is a curated calendar option exposed in the settings
 * panel. The `tag` field is the BCP-47 calendar identifier passed to
 * `Intl.DateTimeFormat`. The `locale` field controls which locale renders
 * the calendar's native month/era names. `isRtl` marks calendars whose
 * formatted output should render right-to-left.
 */

export const CALENDAR_OPTIONS = [
  { id: 'gregory', label: 'Gregorian', tag: 'gregory', locale: 'en', isRtl: false },
  { id: 'persian', label: 'Persian (Solar Hijri)', tag: 'persian', locale: 'fa', isRtl: true },
  { id: 'islamic-umalqura', label: 'Islamic (Umm al-Qura)', tag: 'islamic-umalqura', locale: 'fa', isRtl: true },
  { id: 'hebrew', label: 'Hebrew', tag: 'hebrew', locale: 'he', isRtl: true },
  { id: 'chinese', label: 'Chinese', tag: 'chinese', locale: 'zh', isRtl: false },
  { id: 'japanese', label: 'Japanese (Reiwa)', tag: 'japanese', locale: 'ja', isRtl: false },
  { id: 'buddhist', label: 'Buddhist (Thai)', tag: 'buddhist', locale: 'en', isRtl: false },
  { id: 'indian', label: 'Indian (Saka)', tag: 'indian', locale: 'en', isRtl: false },
  { id: 'coptic', label: 'Coptic', tag: 'coptic', locale: 'en', isRtl: false },
  { id: 'ethiopic', label: 'Ethiopic', tag: 'ethiopic', locale: 'en', isRtl: false },
  { id: 'roc', label: 'Minguo (ROC)', tag: 'roc', locale: 'en', isRtl: false },
]

export const DEFAULT_CALENDAR_ID = 'gregory'

/** Quick lookup by id. */
const optionsById = new Map(CALENDAR_OPTIONS.map((option) => [option.id, option]))

export function getCalendarOption(id) {
  return optionsById.get(id) ?? optionsById.get(DEFAULT_CALENDAR_ID)
}

/**
 * Build a properly ordered date string from Intl parts.
 * For RTL calendars (Persian, Islamic, Hebrew) we want:
 *   weekday, day month year  →  پنجشنبه, ۷ خرداد ۱۴۰۵
 * The default Intl output for `fa` locale sometimes puts year first or
 * uses an unexpected order, so we manually assemble from parts.
 */
function assembleFromParts(formatter, date) {
  try {
    const parts = formatter.formatToParts(date)
    const get = (type) => parts.find((p) => p.type === type)?.value ?? ''

    const weekday = get('weekday')
    const day = get('day')
    const month = get('month')
    const year = get('year')
    const era = get('era')

    // Build: weekday, day month year [era]
    let result = ''
    if (weekday) result += weekday + '، '
    if (day) result += day + ' '
    if (month) result += month + ' '
    if (year) result += year
    if (era) result += ' ' + era

    return result.trim()
  } catch {
    return null
  }
}

/**
 * Format a date for the chosen calendar.
 *
 * @param {Date} date
 * @param {string} calendarId — one of CALENDAR_OPTIONS[].id
 * @param {string} [timeZone] — optional IANA timezone
 * @returns {{ text: string, isRtl: boolean }}
 */
export function formatCalendarDate(date, calendarId, timeZone) {
  const option = getCalendarOption(calendarId)
  const localeWithCalendar = `${option.locale}-u-ca-${option.tag}`
  const dateOptions = {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }
  if (timeZone) dateOptions.timeZone = timeZone

  let text = ''
  try {
    const formatter = new Intl.DateTimeFormat(localeWithCalendar, dateOptions)
    // Use manual assembly for RTL calendars to guarantee proper order
    if (option.isRtl) {
      const assembled = assembleFromParts(formatter, date)
      text = assembled || formatter.format(date)
    } else {
      text = formatter.format(date)
    }
  } catch {
    try {
      text = new Intl.DateTimeFormat('en', dateOptions).format(date)
    } catch {
      text = date.toDateString()
    }
  }

  return { text, isRtl: option.isRtl }
}
