import type { DesignElement, SectionConfig } from '@/core/types'

/**
 * Renders a section's fill + elements to an offscreen canvas.
 * Used by both 3D texture sync and PDF snapshots.
 */
export async function renderSectionToCanvas(
  section: SectionConfig,
  width: number,
  height: number,
): Promise<HTMLCanvasElement> {
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d')!
  ctx.fillStyle = section.fillColor
  ctx.fillRect(0, 0, width, height)

  for (const el of section.elements) {
    await drawElement(ctx, el)
  }
  return canvas
}

async function drawElement(ctx: CanvasRenderingContext2D, el: DesignElement) {
  const { x, y, scaleX, scaleY, rotation, width, height } = el.transform
  ctx.save()
  ctx.translate(x + width / 2, y + height / 2)
  ctx.rotate((rotation * Math.PI) / 180)
  ctx.scale(scaleX, scaleY)
  ctx.translate(-width / 2, -height / 2)

  if (el.type === 'text') {
    ctx.fillStyle = el.fill
    ctx.font = `${el.fontSize}px ${el.fontFamily}`
    ctx.textBaseline = 'top'
    ctx.fillText(el.text, 0, 0, width)
  } else {
    const img = await loadImage(el.src)
    ctx.drawImage(img, 0, 0, width, height)
  }
  ctx.restore()
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => resolve(img)
    img.onerror = reject
    img.src = src
  })
}

export function canvasToDataUrl(canvas: HTMLCanvasElement): string {
  return canvas.toDataURL('image/png')
}
