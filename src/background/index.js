const modules = import.meta.glob('./*.{jpg,jpeg,png,webp,avif}', {
  eager: false,
})

const backgroundCache = new Map()

function formatLabel(path) {
  const file = path.split('/').pop() ?? ''
  const withoutExt = file.replace(/\.[^.]+$/, '')
  return withoutExt
    .replace(/[-_]+/g, ' ')
    .replace(/\s{2,}/g, ' ')
    .trim()
    .replace(/\b\w/g, (char) => char.toUpperCase())
}

export const backgroundOptions = Object.keys(modules)
  .sort((a, b) => a.localeCompare(b))
  .map((relativePath) => ({
    id: relativePath,
    label: formatLabel(relativePath),
  }))

export const DEFAULT_BACKGROUND_ID =
  backgroundOptions[0]?.id ?? './sample-default'

export async function loadBackgroundImage(id) {
  if (backgroundCache.has(id)) {
    return backgroundCache.get(id)
  }
  const loader = modules[id]
  if (typeof loader !== 'function') {
    console.warn('No background loader found for', id)
    return null
  }
  try {
    const module = await loader()
    const url = module?.default ?? null
    backgroundCache.set(id, url)
    return url
  } catch (error) {
    console.error('Failed to load background image', id, error)
    return null
  }
}
