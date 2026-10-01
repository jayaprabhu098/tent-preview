import type { PriceQuote, ShopifyCartPayload, TentConfig } from '@/core/types'

/**
 * Shopify cart adapter. Mock returns a checkout-shaped payload with line-item
 * properties so a real Storefront API / Ajax Cart can be wired later.
 */
export interface ShopifyCartAdapter {
  addToCart(config: TentConfig, quote: PriceQuote): Promise<ShopifyCartPayload>
}

const VARIANT_MAP: Record<string, string> = {
  'canopy_frame': 'gid://shopify/ProductVariant/100001',
  'canopy_only': 'gid://shopify/ProductVariant/100002',
}

export class MockShopifyCartAdapter implements ShopifyCartAdapter {
  async addToCart(config: TentConfig, quote: PriceQuote): Promise<ShopifyCartPayload> {
    await new Promise((r) => setTimeout(r, 250))

    const variantId = VARIANT_MAP[config.setup] ?? VARIANT_MAP.canopy_frame
    const configJson = JSON.stringify(config)

    const properties: Record<string, string> = {
      _configId: config.meta.configId,
      _configJson: configJson.length > 2000 ? configJson.slice(0, 2000) + '…' : configJson,
      Setup: config.setup === 'canopy_frame' ? 'Canopy + Frame' : 'Canopy Only',
      'Back wall': formatWall(config.walls.back),
      'Left wall': formatWall(config.walls.left),
      'Right wall': formatWall(config.walls.right),
      'Quoted total': `$${quote.total.toFixed(2)}`,
      'Quote timestamp': quote.quotedAt,
    }

    return {
      checkoutUrl: `https://example.myshopify.com/cart/${variantId.split('/').pop()}:1?checkout`,
      lineItem: {
        variantId,
        quantity: 1,
        properties,
      },
      quote,
      configId: config.meta.configId,
    }
  }
}

function formatWall(wall: TentConfig['walls']['back']): string {
  if (!wall) return 'None'
  return `${wall.height} / ${wall.print}-sided`
}

export const shopifyCart: ShopifyCartAdapter = new MockShopifyCartAdapter()
