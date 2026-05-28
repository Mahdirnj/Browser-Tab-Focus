/** Format helpers used by the Timezone settings section. */

export function normalizeTimeZoneLabel(zone) {
  return zone
    .split('/')
    .map((part) => part.replace(/_/g, ' '))
    .join(' — ')
}

export function describeTimeZoneOffset(zone) {
  try {
    if (
      typeof Intl === 'undefined' ||
      typeof Intl.DateTimeFormat !== 'function'
    ) {
      return ''
    }
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone: zone,
      timeZoneName: 'shortOffset',
      hour: '2-digit',
      minute: '2-digit',
    })
    const offsetPart = formatter
      .formatToParts(new Date())
      .find((part) => part.type === 'timeZoneName')
    if (!offsetPart) return ''
    return offsetPart.value.replace('GMT', 'UTC')
  } catch {
    try {
      const fallbackFormatter = new Intl.DateTimeFormat('en-US', {
        timeZone: zone,
        timeZoneName: 'short',
      })
      const offsetPart = fallbackFormatter
        .formatToParts(new Date())
        .find((part) => part.type === 'timeZoneName')
      return offsetPart ? offsetPart.value : ''
    } catch (innerError) {
      console.warn('Unable to resolve timezone offset', zone, innerError)
      return ''
    }
  }
}
