const modules = import.meta.glob('./*.{jpg,jpeg,png,webp,avif}', {
  eager: true,
  import: 'default',
})

function formatLabel(path) {
  const file = path.split('/').pop() ?? ''
  const withoutExt = file.replace(/\.[^.]+$/, '')
  return withoutExt
    .replace(/[-_]+/g, ' ')
    .replace(/\s{2,}/g, ' ')
    .trim()
    .replace(/\b\w/g, (char) => char.toUpperCase())
}

const sortedEntries = Object.entries(modules).sort(([a], [b]) =>
  a.localeCompare(b),
)

export const backgroundOptions = sortedEntries.map(([relativePath]) => ({
  id: relativePath,
  label: formatLabel(relativePath),
}))

export const DEFAULT_BACKGROUND_ID =
  backgroundOptions[0]?.id ?? './sample-default'

export function loadBackgroundImage(id) {
  const src = modules[id]
  if (typeof src === 'string') {
    return src
  }
  console.warn('No background loader found for', id)
  return null
}
