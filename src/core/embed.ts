/**
 * iframe postMessage bridge — parent pages can embed `/embed` and sync config.
 *
 * Parent → iframe:
 *   { type: 'tent:getConfig' }
 *   { type: 'tent:setViewMode', mode: '2d' | '3d' }
 *
 * iframe → parent:
 *   { type: 'tent:ready' }
 *   { type: 'tent:configChanged', config }
 *   { type: 'tent:addToCart', payload }
 *   { type: 'tent:config', config }  // response to getConfig
 */

import type { TentConfig, ViewMode, ShopifyCartPayload } from '@/core/types'

const CHANNEL = 'tent-configurator'

export type ParentToEmbed =
  | { channel: typeof CHANNEL; type: 'tent:getConfig' }
  | { channel: typeof CHANNEL; type: 'tent:setViewMode'; mode: ViewMode }

export type EmbedToParent =
  | { channel: typeof CHANNEL; type: 'tent:ready' }
  | { channel: typeof CHANNEL; type: 'tent:configChanged'; config: TentConfig }
  | { channel: typeof CHANNEL; type: 'tent:config'; config: TentConfig }
  | { channel: typeof CHANNEL; type: 'tent:addToCart'; payload: ShopifyCartPayload }

export function postToParent(
  message:
    | { type: 'tent:ready' }
    | { type: 'tent:configChanged'; config: TentConfig }
    | { type: 'tent:config'; config: TentConfig }
    | { type: 'tent:addToCart'; payload: ShopifyCartPayload },
) {
  if (window.parent === window) return
  window.parent.postMessage({ channel: CHANNEL, ...message } satisfies EmbedToParent, '*')
}

export function isParentMessage(data: unknown): data is ParentToEmbed {
  return (
    typeof data === 'object' &&
    data !== null &&
    'channel' in data &&
    (data as { channel: string }).channel === CHANNEL &&
    'type' in data
  )
}
