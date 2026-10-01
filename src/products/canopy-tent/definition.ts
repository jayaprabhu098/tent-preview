import type { ProductId, SectionId, SetupOption, TentConfig } from '@/core/types'
import { CORE_COLORS } from '@/core/types'

export type SectionDef = {
  id: SectionId
  label: string
  aspect: number
  /** Canvas design size in px for 2D editor */
  width: number
  height: number
  /** Whether section is available given current config */
  requiresWall?: 'back' | 'left' | 'right'
}

export type ProductDefinition = {
  id: ProductId
  name: string
  sizeLabel: string
  modelUrl: string
  defaultSetup: SetupOption
  defaultColor: string
  colors: readonly string[]
  sections: SectionDef[]
  setupOptions: Array<{ id: SetupOption; label: string; description: string }>
}

const PANEL = (id: SectionId, label: string, w: number, h: number, requiresWall?: SectionDef['requiresWall']): SectionDef => ({
  id,
  label,
  aspect: w / h,
  width: w,
  height: h,
  requiresWall,
})

export const canopyTentProduct: ProductDefinition = {
  id: 'canopy-tent-10x10',
  name: '10x10 Logo Canopy Tent',
  sizeLabel: '10′ × 10′',
  modelUrl: '/models/tent.glb',
  defaultSetup: 'canopy_frame',
  defaultColor: '#F1B241',
  colors: CORE_COLORS,
  setupOptions: [
    {
      id: 'canopy_frame',
      label: 'Canopy + frame',
      description: 'Printed canopy, 40mm hex aluminum frame, roller bag, ropes & stakes',
    },
    {
      id: 'canopy_only',
      label: 'Canopy only',
      description: 'Printed canopy top for a compatible 10x10 frame',
    },
  ],
  sections: [
    PANEL('canopy', 'Canopy top', 800, 800),
    PANEL('valance_front', 'Valance — front', 800, 140),
    PANEL('valance_back', 'Valance — back', 800, 140),
    PANEL('valance_left', 'Valance — left', 800, 140),
    PANEL('valance_right', 'Valance — right', 800, 140),
    PANEL('wall_back', 'Back wall', 800, 600, 'back'),
    PANEL('wall_left', 'Left wall', 800, 600, 'left'),
    PANEL('wall_right', 'Right wall', 800, 600, 'right'),
  ],
}

export function createDefaultConfig(product: ProductDefinition = canopyTentProduct): TentConfig {
  const sections = Object.fromEntries(
    product.sections.map((s) => [
      s.id,
      {
        fillColor: product.defaultColor,
        elements: [],
      },
    ]),
  ) as unknown as TentConfig['sections']

  return {
    productId: product.id,
    setup: product.defaultSetup,
    walls: { back: null, left: null, right: null },
    sections,
    meta: {
      updatedAt: new Date().toISOString(),
      configId: crypto.randomUUID(),
    },
  }
}

export function getVisibleSections(
  product: ProductDefinition,
  config: TentConfig,
): SectionDef[] {
  return product.sections.filter((s) => {
    if (!s.requiresWall) return true
    return config.walls[s.requiresWall] != null
  })
}
