/** Shared configuration schema — product-agnostic primitives + tent-specific unions. */

export type ProductId = 'canopy-tent-10x10'

export type SetupOption = 'canopy_frame' | 'canopy_only'

export type WallHeight = 'full' | 'half'
export type PrintSides = 'single' | 'double'

export type WallOption = {
  height: WallHeight
  print: PrintSides
}

export type SectionId =
  | 'canopy'
  | 'valance_front'
  | 'valance_back'
  | 'valance_left'
  | 'valance_right'
  | 'wall_back'
  | 'wall_left'
  | 'wall_right'

export type Transform2D = {
  x: number
  y: number
  scaleX: number
  scaleY: number
  rotation: number
  width: number
  height: number
}

export type TextElement = {
  id: string
  type: 'text'
  text: string
  fontSize: number
  fill: string
  fontFamily: string
  transform: Transform2D
}

export type ImageElement = {
  id: string
  type: 'image'
  src: string
  name: string
  transform: Transform2D
}

export type DesignElement = TextElement | ImageElement

export type SectionConfig = {
  fillColor: string
  elements: DesignElement[]
}

export type TentConfig = {
  productId: ProductId
  setup: SetupOption
  walls: {
    back: WallOption | null
    left: WallOption | null
    right: WallOption | null
  }
  sections: Record<SectionId, SectionConfig>
  meta: {
    updatedAt: string
    configId: string
  }
}

export type PriceLine = {
  sku: string
  label: string
  quantity: number
  unitPrice: number
  total: number
}

export type PriceQuote = {
  currency: string
  subtotal: number
  lines: PriceLine[]
  total: number
  quotedAt: string
}

export type ShopifyCartPayload = {
  checkoutUrl: string
  lineItem: {
    variantId: string
    quantity: number
    properties: Record<string, string>
  }
  quote: PriceQuote
  configId: string
}

export type ViewMode = '2d' | '3d'

export const SECTION_LABELS: Record<SectionId, string> = {
  canopy: 'Canopy top',
  valance_front: 'Valance — front',
  valance_back: 'Valance — back',
  valance_left: 'Valance — left',
  valance_right: 'Valance — right',
  wall_back: 'Back wall',
  wall_left: 'Left wall',
  wall_right: 'Right wall',
}

export const CORE_COLORS = [
  '#FFFFFF',
  '#F1B241',
  '#C45C26',
  '#1B3A4B',
  '#0F1419',
  '#E63946',
  '#2A9D8F',
  '#264653',
  '#E9C46A',
  '#457B9D',
] as const
