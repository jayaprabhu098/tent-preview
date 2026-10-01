import { useCallback, useEffect, useState } from 'react'
import { useConfigStore } from '@/core/store'
import { pricingService } from '@/services/pricing'
import { shopifyCart } from '@/services/shopify'
import { generateConfigPdf, downloadBlob } from '@/utils/pdf'
import { renderSectionToCanvas, canvasToDataUrl } from '@/utils/sectionCanvas'
import { postToParent } from '@/core/embed'
import type { PriceQuote } from '@/core/types'
import type Konva from 'konva'

type PriceSummaryProps = {
  glCanvasRef: React.MutableRefObject<HTMLCanvasElement | null>
  stageRef: React.MutableRefObject<Konva.Stage | null>
}

export function PriceSummary({ glCanvasRef, stageRef }: PriceSummaryProps) {
  const config = useConfigStore((s) => s.config)
  const embedMode = useConfigStore((s) => s.embedMode)
  const [quote, setQuote] = useState<PriceQuote | null>(null)
  const [loading, setLoading] = useState(false)
  const [cartMsg, setCartMsg] = useState<string | null>(null)
  const [busy, setBusy] = useState<'cart' | 'pdf' | null>(null)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    const t = window.setTimeout(() => {
      pricingService.quote(config).then((q) => {
        if (!cancelled) {
          setQuote(q)
          setLoading(false)
        }
      })
    }, 200)
    return () => {
      cancelled = true
      window.clearTimeout(t)
    }
  }, [config])

  const addToCart = useCallback(async () => {
    if (!quote) return
    setBusy('cart')
    setCartMsg(null)
    try {
      const payload = await shopifyCart.addToCart(config, quote)
      postToParent({ type: 'tent:addToCart', payload })
      setCartMsg(
        embedMode
          ? 'Sent cart payload to parent page (mock Shopify).'
          : `Mock checkout ready — $${payload.quote.total.toFixed(2)}. Config ID ${payload.configId.slice(0, 8)}…`,
      )
    } catch {
      setCartMsg('Cart request failed.')
    } finally {
      setBusy(null)
    }
  }, [config, quote, embedMode])

  const exportPdf = useCallback(async () => {
    if (!quote) return
    setBusy('pdf')
    try {
      let previewDataUrl: string | null = null
      let panelDataUrl: string | null = null
      try {
        previewDataUrl = glCanvasRef.current?.toDataURL('image/png') ?? null
      } catch {
        previewDataUrl = null
      }
      try {
        if (stageRef.current) {
          panelDataUrl = stageRef.current.toDataURL({ pixelRatio: 2 })
        } else {
          const sectionId = useConfigStore.getState().selectedSectionId
          const canvas = await renderSectionToCanvas(config.sections[sectionId], 512, 512)
          panelDataUrl = canvasToDataUrl(canvas)
        }
      } catch {
        panelDataUrl = null
      }
      const blob = await generateConfigPdf(config, quote, { previewDataUrl, panelDataUrl })
      downloadBlob(blob, `config-${config.meta.configId.slice(0, 8)}.pdf`)
    } finally {
      setBusy(null)
    }
  }, [config, quote, glCanvasRef, stageRef])

  return (
    <aside className="flex h-full flex-col border-l border-[var(--color-line)] bg-[var(--color-panel)]">
      <div className="border-b border-[var(--color-line)] px-4 py-4">
        <h3 className="font-[family-name:var(--font-display)] text-sm font-semibold tracking-wide uppercase text-[var(--color-muted)]">
          Price summary
        </h3>
        <p className="mt-1 text-xs text-[var(--color-muted)]">Via pricing API (mock)</p>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-3">
        {loading && !quote && (
          <p className="text-sm text-[var(--color-muted)]">Fetching quote…</p>
        )}
        {quote && (
          <ul className="space-y-2">
            {quote.lines.map((line) => (
              <li key={line.sku + line.label} className="flex justify-between gap-2 text-sm">
                <span className="text-[var(--color-ink)]">{line.label}</span>
                <span className="shrink-0 font-medium tabular-nums">
                  ${line.total.toFixed(2)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="border-t border-[var(--color-line)] px-4 py-4">
        <div className="mb-3 flex items-baseline justify-between">
          <span className="text-sm text-[var(--color-muted)]">Total</span>
          <span className="font-[family-name:var(--font-display)] text-2xl font-bold tabular-nums">
            {quote ? `$${quote.total.toFixed(2)}` : '—'}
            {loading && quote && (
              <span className="ml-2 text-xs font-normal text-[var(--color-muted)]">updating…</span>
            )}
          </span>
        </div>

        <button
          type="button"
          disabled={!quote || busy === 'cart'}
          onClick={addToCart}
          className="w-full rounded-lg bg-[var(--color-accent)] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[var(--color-accent-dark)] disabled:opacity-50"
        >
          {busy === 'cart' ? 'Adding…' : 'Add to cart'}
        </button>
        <button
          type="button"
          disabled={!quote || busy === 'pdf'}
          onClick={exportPdf}
          className="mt-2 w-full rounded-lg border border-[var(--color-line)] px-4 py-2.5 text-sm font-medium hover:bg-[var(--color-paper)] disabled:opacity-50"
        >
          {busy === 'pdf' ? 'Generating…' : 'Download configuration PDF'}
        </button>
        {cartMsg && (
          <p className="mt-3 text-xs leading-relaxed text-[var(--color-success)]">{cartMsg}</p>
        )}
      </div>
    </aside>
  )
}
