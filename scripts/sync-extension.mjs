import fs from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

async function copyDir(source, destination) {
  await fs.mkdir(destination, { recursive: true })
  const entries = await fs.readdir(source, { withFileTypes: true })

  await Promise.all(
    entries.map(async (entry) => {
      const srcPath = path.join(source, entry.name)
      const destPath = path.join(destination, entry.name)

      if (entry.isDirectory()) {
        await copyDir(srcPath, destPath)
        return
      }

      await fs.copyFile(srcPath, destPath)
    }),
  )
}

async function main() {
  const rootDir = path.dirname(fileURLToPath(import.meta.url))
  const distDir = path.resolve(rootDir, '../dist')
  const targetDir = path.resolve(rootDir, '../extension/newtab')

  await fs.rm(targetDir, { recursive: true, force: true })
  await copyDir(distDir, targetDir)
  console.log(`Synced build artifacts from ${distDir} -> ${targetDir}`)
}

main().catch((error) => {
  console.error('Failed to sync extension files:', error)
  process.exitCode = 1
})
