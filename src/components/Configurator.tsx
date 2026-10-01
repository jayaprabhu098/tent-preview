import { useEffect, useRef } from 'react'
import type Konva from 'konva'
import { useConfigStore } from '@/core/store'
import { OptionsPanel } from '@/components/OptionsPanel'
import { Editor2D } from '@/components/Editor2D'
import { Preview3D } from '@/components/Preview3D'
import { PriceSummary } from '@/components/PriceSummary'
import { isParentMessage, postToParent } from '@/core/embed'

type ConfiguratorProps = {
  embed?: boolean
}

export function Configurator({ embed = false }: ConfiguratorProps) {
  const viewMode = useConfigStore((s) => s.viewMode)
  const setViewMode = useConfigStore((s) => s.setViewMode)
  const setEmbedMode = useConfigStore((s) => s.setEmbedMode)
  const config = useConfigStore((s) => s.config)
  const selectedSectionId = useConfigStore((s) => s.selectedSectionId)
  const resetConfig = useConfigStore((s) => s.resetConfig)

  const glCanvasRef = useRef<HTMLCanvasElement | null>(null)
  const stageRef = useRef<Konva.Stage | null>(null)

  useEffect(() => {
    setEmbedMode(embed)
  }, [embed, setEmbedMode])

  useEffect(() => {
    if (!embed) return
    postToParent({ type: 'tent:ready' })
  }, [embed])

  useEffect(() => {
    if (!embed) return
    postToParent({ type: 'tent:configChanged', config })
  }, [embed, config])

  useEffect(() => {
    if (!embed) return
    const onMessage = (event: MessageEvent) => {
      if (!isParentMessage(event.data)) return
      const msg = event.data
      if (msg.type === 'tent:getConfig') {
        postToParent({ type: 'tent:config', config: useConfigStore.getState().getConfigSnapshot() })
      }
      if (msg.type === 'tent:setViewMode') {
        setViewMode(msg.mode)
      }
    }
    window.addEventListener('message', onMessage)
    return () => window.removeEventListener('message', onMessage)
  }, [embed, setViewMode])

  return (
    <div className={`flex h-full min-h-0 flex-col ${embed ? '' : ''}`}>
      {!embed && (
        <header className="flex shrink-0 items-center justify-between border-b border-[var(--color-line)] bg-[var(--color-panel)] px-4 py-3 md:px-6">
          <div>
            <p className="font-[family-name:var(--font-display)] text-lg font-bold tracking-tight">
              Tent Configurator
            </p>
            <p className="text-xs text-[var(--color-muted)]">
              Interactive product demo · React + TypeScript
            </p>
          </div>
          <button
            type="button"
            onClick={resetConfig}
            className="rounded-md border border-[var(--color-line)] px-3 py-1.5 text-xs font-medium hover:bg-[var(--color-paper)]"
          >
            Reset
          </button>
        </header>
      )}

      <div className="grid min-h-0 flex-1 grid-cols-1 lg:grid-cols-[320px_1fr_280px]">
        <div className="min-h-0 max-h-[40vh] overflow-hidden border-b border-[var(--color-line)] lg:max-h-none lg:border-b-0 lg:border-r">
          <OptionsPanel />
        </div>

        <div className="relative flex min-h-[320px] flex-col lg:min-h-0">
          <div className="absolute top-3 left-1/2 z-10 flex -translate-x-1/2 gap-1 rounded-full border border-[var(--color-line)] bg-white/90 p-1 shadow-sm backdrop-blur">
            <button
              type="button"
              onClick={() => setViewMode('3d')}
              className={`rounded-full px-4 py-1.5 text-xs font-semibold transition ${
                viewMode === '3d' ? 'bg-[var(--color-ink)] text-white' : 'text-[var(--color-muted)]'
              }`}
            >
              3D preview
            </button>
            <button
              type="button"
              onClick={() => setViewMode('2d')}
              className={`rounded-full px-4 py-1.5 text-xs font-semibold transition ${
                viewMode === '2d' ? 'bg-[var(--color-ink)] text-white' : 'text-[var(--color-muted)]'
              }`}
            >
              2D editor
            </button>
          </div>
          <div className="absolute top-3 right-3 z-10 rounded bg-black/45 px-2 py-1 text-[10px] tracking-wide text-white uppercase">
            {selectedSectionId.replaceAll('_', ' ')}
          </div>
          <div className={`min-h-0 flex-1 ${viewMode === '3d' ? 'block' : 'hidden'}`}>
            <Preview3D canvasRef={glCanvasRef} />
          </div>
          <div className={`min-h-0 flex-1 ${viewMode === '2d' ? 'block' : 'hidden'}`}>
            <Editor2D stageRef={stageRef} />
          </div>
        </div>

        <div className="min-h-0 max-h-[35vh] border-t border-[var(--color-line)] lg:max-h-none lg:border-t-0">
          <PriceSummary glCanvasRef={glCanvasRef} stageRef={stageRef} />
        </div>
      </div>
    </div>
  )
}
