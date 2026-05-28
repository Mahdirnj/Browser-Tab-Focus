/**
 * Image resize / load helpers used by the custom background uploader.
 *
 * Goals:
 * - Keep stored images small enough that one fits comfortably in localStorage
 *   (~5 MB cap) and many fit in IndexedDB.
 * - Re-encode every input as JPEG @ ~0.85 quality, bounded to 2560px on the
 *   longest edge. That gives 4K-ish wallpapers around 500 KB - 1.5 MB.
 * - Be tolerant of non-CORS URLs by surfacing a clear error so the UI can
 *   suggest "download then upload".
 */

const MAX_DIMENSION = 2560
const QUALITY = 0.85
export const MAX_FILE_SIZE_BYTES = 12 * 1024 * 1024 // 12 MB raw input cap

function loadBitmap(blobOrFile) {
  if (typeof window !== 'undefined' && typeof window.createImageBitmap === 'function') {
    return window.createImageBitmap(blobOrFile)
  }
  // Fallback for older browsers — load via Image element + object URL
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(blobOrFile)
    const image = new Image()
    image.onload = () => {
      URL.revokeObjectURL(url)
      resolve(image)
    }
    image.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error('Could not decode image.'))
    }
    image.src = url
  })
}

function getBitmapSize(bitmap) {
  const width = bitmap.width ?? bitmap.naturalWidth ?? 0
  const height = bitmap.height ?? bitmap.naturalHeight ?? 0
  return { width, height }
}

/**
 * Resize an image Blob/File to a JPEG data URL bounded to MAX_DIMENSION.
 * @param {Blob|File} blobOrFile
 * @returns {Promise<{ dataUrl: string, width: number, height: number }>}
 */
export async function resizeImageToDataUrl(blobOrFile) {
  if (!blobOrFile) {
    throw new Error('No image provided.')
  }
  if (blobOrFile.size && blobOrFile.size > MAX_FILE_SIZE_BYTES) {
    throw new Error('Image is larger than 12 MB. Please pick a smaller file.')
  }
  if (blobOrFile.type && !blobOrFile.type.startsWith('image/')) {
    throw new Error('That file is not an image.')
  }

  let bitmap
  try {
    bitmap = await loadBitmap(blobOrFile)
  } catch {
    throw new Error('Could not read that image. Try a different file.')
  }

  const { width, height } = getBitmapSize(bitmap)
  if (!width || !height) {
    throw new Error('Image has no dimensions.')
  }

  const scale = Math.min(1, MAX_DIMENSION / Math.max(width, height))
  const targetWidth = Math.max(1, Math.round(width * scale))
  const targetHeight = Math.max(1, Math.round(height * scale))

  const canvas = document.createElement('canvas')
  canvas.width = targetWidth
  canvas.height = targetHeight
  const ctx = canvas.getContext('2d')
  if (!ctx) {
    throw new Error('Browser does not support canvas drawing.')
  }
  ctx.drawImage(bitmap, 0, 0, targetWidth, targetHeight)
  if (typeof bitmap.close === 'function') {
    bitmap.close()
  }

  const dataUrl = canvas.toDataURL('image/jpeg', QUALITY)
  return { dataUrl, width: targetWidth, height: targetHeight }
}
