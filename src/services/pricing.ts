import type { PriceLine, PriceQuote, TentConfig } from '@/core/types'

/**
 * Pricing is always obtained through this service — never hard-coded in UI components.
 * Swap `MockPricingService` for a real HTTP client against Shopify/CRM later.
 */
export interface PricingService {
  quote(config: TentConfig): Promise<PriceQuote>
}

/** Catalog SKUs and unit prices live only in the pricing layer. */
const CATALOG = {
  canopy_frame: { sku: 'TENT-10x10-FULL', label: '10x10 canopy + frame kit', price: 849 },
  canopy_only: { sku: 'TENT-10x10-TOP', label: '10x10 canopy only', price: 549 },
  wall_full_single: { sku: 'WALL-10-FULL-SS', label: 'Full wall (single-sided)', price: 159 },
  wall_full_double: { sku: 'WALL-10-FULL-DS', label: 'Full wall (double-sided)', price: 229 },
  wall_half_single: { sku: 'WALL-10-HALF-SS', label: 'Half wall (single-sided)', price: 99 },
  wall_half_double: { sku: 'WALL-10-HALF-DS', label: 'Half wall (double-sided)', price: 149 },
  branding: { sku: 'BRAND-CUSTOM', label: 'Custom branding / artwork setup', price: 0 },
} as const

function wallSku(height: 'full' | 'half', print: 'single' | 'double') {
  if (height === 'full' && print === 'single') return CATALOG.wall_full_single
  if (height === 'full' && print === 'double') return CATALOG.wall_full_double
  if (height === 'half' && print === 'single') return CATALOG.wall_half_single
  return CATALOG.wall_half_double
}

function hasBranding(config: TentConfig): boolean {
  return Object.values(config.sections).some((s) => s.elements.length > 0)
}

function buildQuote(config: TentConfig): PriceQuote {
  const lines: PriceLine[] = []

  const base = config.setup === 'canopy_frame' ? CATALOG.canopy_frame : CATALOG.canopy_only
  lines.push({
    sku: base.sku,
    label: base.label,
    quantity: 1,
    unitPrice: base.price,
    total: base.price,
  })

  for (const [side, wall] of Object.entries(config.walls) as Array<
    ['back' | 'left' | 'right', TentConfig['walls']['back']]
  >) {
    if (!wall) continue
    const item = wallSku(wall.height, wall.print)
    lines.push({
      sku: item.sku,
      label: `${item.label} — ${side}`,
      quantity: 1,
      unitPrice: item.price,
      total: item.price,
    })
  }

  if (hasBranding(config)) {
    lines.push({
      sku: CATALOG.branding.sku,
      label: CATALOG.branding.label,
      quantity: 1,
      unitPrice: CATALOG.branding.price,
      total: CATALOG.branding.price,
    })
  }

  const subtotal = lines.reduce((sum, l) => sum + l.total, 0)

  return {
    currency: 'USD',
    subtotal,
    lines,
    total: subtotal,
    quotedAt: new Date().toISOString(),
  }
}

/** Simulates network latency against a pricing/CRM API. */
export class MockPricingService implements PricingService {
  async quote(config: TentConfig): Promise<PriceQuote> {
    await delay(180 + Math.random() * 120)
    return buildQuote(config)
  }
}

export const pricingService: PricingService = new MockPricingService()

function delay(ms: number) {
  return new Promise((r) => setTimeout(r, ms))
}

/** Pure helper for PDF / tests without async. */
export function quoteSync(config: TentConfig): PriceQuote {
  return buildQuote(config)
}
