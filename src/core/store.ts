import { create } from 'zustand'
import { subscribeWithSelector } from 'zustand/middleware'
import type {
  DesignElement,
  ImageElement,
  SectionId,
  SetupOption,
  TentConfig,
  TextElement,
  ViewMode,
  WallOption,
} from '@/core/types'
import { createDefaultConfig } from '@/products/canopy-tent/definition'

type ConfigState = {
  config: TentConfig
  selectedSectionId: SectionId
  selectedElementId: string | null
  viewMode: ViewMode
  embedMode: boolean

  setEmbedMode: (v: boolean) => void
  setViewMode: (mode: ViewMode) => void
  setSelectedSection: (id: SectionId) => void
  setSelectedElement: (id: string | null) => void
  setSetup: (setup: SetupOption) => void
  setWall: (side: 'back' | 'left' | 'right', option: WallOption | null) => void
  setSectionColor: (sectionId: SectionId, color: string) => void
  applyColorToAll: (color: string) => void
  addText: (sectionId: SectionId, partial?: Partial<TextElement>) => void
  addImage: (sectionId: SectionId, src: string, name: string) => void
  updateElement: (sectionId: SectionId, elementId: string, patch: Partial<DesignElement>) => void
  removeElement: (sectionId: SectionId, elementId: string) => void
  resetConfig: () => void
  getConfigSnapshot: () => TentConfig
}

function touch(config: TentConfig): TentConfig {
  return {
    ...config,
    meta: { ...config.meta, updatedAt: new Date().toISOString() },
  }
}

function uid() {
  return crypto.randomUUID()
}

export const useConfigStore = create<ConfigState>()(
  subscribeWithSelector((set, get) => ({
    config: createDefaultConfig(),
    selectedSectionId: 'canopy',
    selectedElementId: null,
    viewMode: '3d',
    embedMode: false,

    setEmbedMode: (v) => set({ embedMode: v }),
    setViewMode: (mode) => set({ viewMode: mode }),
    setSelectedSection: (id) => set({ selectedSectionId: id, selectedElementId: null }),
    setSelectedElement: (id) => set({ selectedElementId: id }),

    setSetup: (setup) =>
      set((s) => ({ config: touch({ ...s.config, setup }) })),

    setWall: (side, option) =>
      set((s) => {
        const walls = { ...s.config.walls, [side]: option }
        let selectedSectionId = s.selectedSectionId
        if (!option && selectedSectionId === `wall_${side}`) {
          selectedSectionId = 'canopy'
        }
        return {
          config: touch({ ...s.config, walls }),
          selectedSectionId,
        }
      }),

    setSectionColor: (sectionId, color) =>
      set((s) => ({
        config: touch({
          ...s.config,
          sections: {
            ...s.config.sections,
            [sectionId]: { ...s.config.sections[sectionId], fillColor: color },
          },
        }),
      })),

    applyColorToAll: (color) =>
      set((s) => {
        const sections = { ...s.config.sections }
        for (const key of Object.keys(sections) as SectionId[]) {
          sections[key] = { ...sections[key], fillColor: color }
        }
        return { config: touch({ ...s.config, sections }) }
      }),

    addText: (sectionId, partial) =>
      set((s) => {
        const el: TextElement = {
          id: uid(),
          type: 'text',
          text: partial?.text ?? 'Your Brand',
          fontSize: partial?.fontSize ?? 48,
          fill: partial?.fill ?? '#0F1419',
          fontFamily: partial?.fontFamily ?? 'Syne, sans-serif',
          transform: partial?.transform ?? {
            x: 200,
            y: 280,
            scaleX: 1,
            scaleY: 1,
            rotation: 0,
            width: 400,
            height: 60,
          },
        }
        const section = s.config.sections[sectionId]
        return {
          selectedElementId: el.id,
          config: touch({
            ...s.config,
            sections: {
              ...s.config.sections,
              [sectionId]: { ...section, elements: [...section.elements, el] },
            },
          }),
        }
      }),

    addImage: (sectionId, src, name) =>
      set((s) => {
        const el: ImageElement = {
          id: uid(),
          type: 'image',
          src,
          name,
          transform: {
            x: 250,
            y: 250,
            scaleX: 1,
            scaleY: 1,
            rotation: 0,
            width: 200,
            height: 200,
          },
        }
        const section = s.config.sections[sectionId]
        return {
          selectedElementId: el.id,
          viewMode: '2d',
          config: touch({
            ...s.config,
            sections: {
              ...s.config.sections,
              [sectionId]: { ...section, elements: [...section.elements, el] },
            },
          }),
        }
      }),

    updateElement: (sectionId, elementId, patch) =>
      set((s) => {
        const section = s.config.sections[sectionId]
        const elements = section.elements.map((el) => {
          if (el.id !== elementId) return el
          if (el.type === 'text' && (patch.type === undefined || patch.type === 'text')) {
            return { ...el, ...patch, type: 'text' } as TextElement
          }
          if (el.type === 'image' && (patch.type === undefined || patch.type === 'image')) {
            return { ...el, ...patch, type: 'image' } as ImageElement
          }
          return el
        })
        return {
          config: touch({
            ...s.config,
            sections: {
              ...s.config.sections,
              [sectionId]: { ...section, elements },
            },
          }),
        }
      }),

    removeElement: (sectionId, elementId) =>
      set((s) => {
        const section = s.config.sections[sectionId]
        return {
          selectedElementId: s.selectedElementId === elementId ? null : s.selectedElementId,
          config: touch({
            ...s.config,
            sections: {
              ...s.config.sections,
              [sectionId]: {
                ...section,
                elements: section.elements.filter((e) => e.id !== elementId),
              },
            },
          }),
        }
      }),

    resetConfig: () =>
      set({
        config: createDefaultConfig(),
        selectedSectionId: 'canopy',
        selectedElementId: null,
      }),

    getConfigSnapshot: () => structuredClone(get().config),
  })),
)
