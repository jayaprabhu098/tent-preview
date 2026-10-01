import { jsPDF } from 'jspdf'
import type { PriceQuote, TentConfig } from '@/core/types'
import { SECTION_LABELS } from '@/core/types'
import { canopyTentProduct } from '@/products/canopy-tent/definition'

type PdfAssets = {
  previewDataUrl?: string | null
  panelDataUrl?: string | null
}

export async function generateConfigPdf(
  config: TentConfig,
  quote: PriceQuote,
  assets: PdfAssets = {},
): Promise<Blob> {
  const doc = new jsPDF({ unit: 'pt', format: 'letter' })
  const margin = 48
  let y = margin

  const h1 = () => {
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(18)
  }
  const body = () => {
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(11)
  }
  const muted = () => {
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(9)
    doc.setTextColor(100)
  }
  const ink = () => doc.setTextColor(15, 20, 25)

  h1()
  ink()
  doc.text('Configuration / Production Summary', margin, y)
  y += 22
  muted()
  doc.text(`Config ID: ${config.meta.configId}`, margin, y)
  y += 14
  doc.text(`Generated: ${new Date().toLocaleString()}`, margin, y)
  y += 14
  doc.text(`Last updated: ${config.meta.updatedAt}`, margin, y)
  y += 28
  ink()

  h1()
  doc.setFontSize(14)
  doc.text(canopyTentProduct.name, margin, y)
  y += 18
  body()
  doc.text(`Size: ${canopyTentProduct.sizeLabel}`, margin, y)
  y += 16
  doc.text(
    `Setup: ${config.setup === 'canopy_frame' ? 'Canopy + Frame' : 'Canopy Only'}`,
    margin,
    y,
  )
  y += 24

  doc.setFont('helvetica', 'bold')
  doc.text('Walls', margin, y)
  y += 16
  body()
  for (const side of ['back', 'left', 'right'] as const) {
    const w = config.walls[side]
    const label = w
      ? `${w.height} wall, ${w.print}-sided print`
      : 'None'
    doc.text(`${side}: ${label}`, margin, y)
    y += 14
  }
  y += 12

  doc.setFont('helvetica', 'bold')
  doc.text('Section colors & branding', margin, y)
  y += 16
  body()
  for (const [id, section] of Object.entries(config.sections)) {
    const title = SECTION_LABELS[id as keyof typeof SECTION_LABELS] ?? id
    const elemCount = section.elements.length
    doc.text(
      `${title}: ${section.fillColor} · ${elemCount} element(s)`,
      margin,
      y,
    )
    y += 14
    for (const el of section.elements) {
      const detail =
        el.type === 'text'
          ? `text “${el.text}” @ (${Math.round(el.transform.x)}, ${Math.round(el.transform.y)})`
          : `image “${el.name}” @ (${Math.round(el.transform.x)}, ${Math.round(el.transform.y)})`
      doc.setFontSize(9)
      doc.text(`  – ${detail}`, margin, y)
      doc.setFontSize(11)
      y += 12
      if (y > 700) {
        doc.addPage()
        y = margin
      }
    }
  }
  y += 16

  if (y > 520) {
    doc.addPage()
    y = margin
  }

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(14)
  doc.text('Price quote', margin, y)
  y += 18
  body()
  for (const line of quote.lines) {
    doc.text(
      `${line.label}  ×${line.quantity}  $${line.total.toFixed(2)}`,
      margin,
      y,
    )
    y += 14
  }
  y += 8
  doc.setFont('helvetica', 'bold')
  doc.text(`Total: $${quote.total.toFixed(2)} ${quote.currency}`, margin, y)
  y += 12
  muted()
  doc.text(`Quoted at: ${quote.quotedAt}`, margin, y)
  ink()
  y += 28

  if (assets.previewDataUrl) {
    if (y > 400) {
      doc.addPage()
      y = margin
    }
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(14)
    ink()
    doc.text('3D / preview snapshot', margin, y)
    y += 12
    try {
      doc.addImage(assets.previewDataUrl, 'PNG', margin, y, 500, 280)
      y += 300
    } catch {
      body()
      doc.text('(Preview image unavailable)', margin, y)
      y += 20
    }
  }

  if (assets.panelDataUrl) {
    if (y > 500) {
      doc.addPage()
      y = margin
    }
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(14)
    ink()
    doc.text('Active 2D panel', margin, y)
    y += 12
    try {
      doc.addImage(assets.panelDataUrl, 'PNG', margin, y, 400, 400)
    } catch {
      body()
      doc.text('(Panel image unavailable)', margin, y)
    }
  }

  doc.addPage()
  y = margin
  h1()
  ink()
  doc.text('Shopify order association', margin, y)
  y += 20
  body()
  const note = doc.splitTextToSize(
    'Attach this PDF to the Shopify order (order metafield, note attribute, or fulfillment attachment). ' +
      `Reference config ID ${config.meta.configId} in line-item properties so production can match artwork.`,
    500,
  )
  doc.text(note, margin, y)

  return doc.output('blob')
}

export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}
