import fs from 'node:fs'
import fsp from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import archiver from 'archiver'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const rootDir = path.resolve(__dirname, '..')
const extensionDir = path.resolve(rootDir, 'extension')
const releaseDir = path.resolve(rootDir, 'release')

async function readManifest() {
  const manifestPath = path.join(extensionDir, 'manifest.json')
  const raw = await fsp.readFile(manifestPath, 'utf8')
  return JSON.parse(raw)
}

async function createZip(version) {
  await fsp.mkdir(releaseDir, { recursive: true })
  const zipName = `focusloom-extension-v${version}.zip`
  const destination = path.join(releaseDir, zipName)

  if (fs.existsSync(destination)) {
    await fsp.rm(destination)
  }

  const output = fs.createWriteStream(destination)
  const archive = archiver('zip', {
    zlib: { level: 9 },
  })

  const archivePromise = new Promise((resolve, reject) => {
    output.on('close', resolve)
    archive.on('error', reject)
  })

  archive.pipe(output)
  archive.directory(extensionDir, false)
  archive.finalize()

  await archivePromise
  return { destination, size: archive.pointer() }
}

async function main() {
  const manifest = await readManifest()
  const version = manifest.version ?? '0.0.0'
  const { destination, size } = await createZip(version)
  console.log(
    `Created ${path.relative(rootDir, destination)} (${(size / 1024).toFixed(1)} kB)`,
  )
}

main().catch((error) => {
  console.error('Failed to package Chrome extension:', error)
  process.exitCode = 1
})
