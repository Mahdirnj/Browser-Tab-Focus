import rawQuotes from './quotes.json'

/**
 * All quotes from the bundled collection.
 * Each entry: { text: string, author: string }
 */
export const quotes = rawQuotes.quotes.map((q) => ({
  text: q.text,
  author: q.from,
}))

/**
 * Returns the quote for today using a day-seeded index.
 * Cycles back to the start after all quotes are shown (~199 days).
 */
export function getTodayQuote() {
  const dayIndex = Math.floor(Date.now() / 86_400_000)
  return quotes[dayIndex % quotes.length]
}
