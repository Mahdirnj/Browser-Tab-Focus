const modules = import.meta.glob('./*.{jpg,jpeg,png,webp,avif}', {
  eager: true,
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

export const backgroundOptions = Object.entries(modules).map(
  ([relativePath, module]) => ({
    id: relativePath,
    label: formatLabel(relativePath),
    url: module.default,
  }),
)

export const DEFAULT_BACKGROUND_ID =
  backgroundOptions[0]?.id ?? './sample-default'
