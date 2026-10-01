import { useConfigStore } from '@/core/store'
import { canopyTentProduct, getVisibleSections } from '@/products/canopy-tent/definition'
import type { WallHeight, PrintSides, WallOption } from '@/core/types'

function SectionCard({
  title,
  children,
}: {
  title: string
  children: React.ReactNode
}) {
  return (
    <section className="border-b border-[var(--color-line)] px-4 py-4">
      <h3 className="mb-3 font-[family-name:var(--font-display)] text-sm font-semibold tracking-wide uppercase text-[var(--color-muted)]">
        {title}
      </h3>
      {children}
    </section>
  )
}

function WallControls({
  side,
  label,
}: {
  side: 'back' | 'left' | 'right'
  label: string
}) {
  const wall = useConfigStore((s) => s.config.walls[side])
  const setWall = useConfigStore((s) => s.setWall)

  const setEnabled = (on: boolean) => {
    if (!on) setWall(side, null)
    else setWall(side, { height: 'full', print: 'single' })
  }

  const patch = (p: Partial<WallOption>) => {
    if (!wall) return
    setWall(side, { ...wall, ...p })
  }

  return (
    <div className="mb-3 rounded-lg border border-[var(--color-line)] bg-[var(--color-paper)] p-3">
      <label className="flex items-center justify-between gap-2 text-sm font-medium">
        <span>{label}</span>
        <input
          type="checkbox"
          checked={wall != null}
          onChange={(e) => setEnabled(e.target.checked)}
          className="size-4 accent-[var(--color-accent)]"
        />
      </label>
      {wall && (
        <div className="mt-2 grid grid-cols-2 gap-2 text-xs">
          <label className="flex flex-col gap-1">
            Height
            <select
              value={wall.height}
              onChange={(e) => patch({ height: e.target.value as WallHeight })}
              className="rounded border border-[var(--color-line)] bg-white px-2 py-1.5"
            >
              <option value="full">Full wall</option>
              <option value="half">Half wall</option>
            </select>
          </label>
          <label className="flex flex-col gap-1">
            Print
            <select
              value={wall.print}
              onChange={(e) => patch({ print: e.target.value as PrintSides })}
              className="rounded border border-[var(--color-line)] bg-white px-2 py-1.5"
            >
              <option value="single">Single-sided</option>
              <option value="double">Double-sided</option>
            </select>
          </label>
        </div>
      )}
    </div>
  )
}

export function OptionsPanel() {
  const config = useConfigStore((s) => s.config)
  const selectedSectionId = useConfigStore((s) => s.selectedSectionId)
  const selectedElementId = useConfigStore((s) => s.selectedElementId)
  const setSetup = useConfigStore((s) => s.setSetup)
  const setSelectedSection = useConfigStore((s) => s.setSelectedSection)
  const setSectionColor = useConfigStore((s) => s.setSectionColor)
  const applyColorToAll = useConfigStore((s) => s.applyColorToAll)
  const addText = useConfigStore((s) => s.addText)
  const addImage = useConfigStore((s) => s.addImage)
  const updateElement = useConfigStore((s) => s.updateElement)
  const removeElement = useConfigStore((s) => s.removeElement)
  const setViewMode = useConfigStore((s) => s.setViewMode)

  const visible = getVisibleSections(canopyTentProduct, config)
  const section = config.sections[selectedSectionId]
  const selectedEl = section.elements.find((e) => e.id === selectedElementId)

  const onUpload = (file: File | null) => {
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        addImage(selectedSectionId, reader.result, file.name)
      }
    }
    reader.readAsDataURL(file)
  }

  return (
    <div className="flex h-full flex-col overflow-y-auto bg-[var(--color-panel)]">
      <div className="border-b border-[var(--color-line)] px-4 py-4">
        <p className="font-[family-name:var(--font-display)] text-xs font-semibold tracking-[0.2em] text-[var(--color-accent)] uppercase">
          MVP-style demo
        </p>
        <h2 className="mt-1 font-[family-name:var(--font-display)] text-xl font-bold leading-tight">
          {canopyTentProduct.name}
        </h2>
        <p className="mt-1 text-sm text-[var(--color-muted)]">{canopyTentProduct.sizeLabel}</p>
      </div>

      <SectionCard title="Choose your setup">
        <div className="flex flex-col gap-2">
          {canopyTentProduct.setupOptions.map((opt) => (
            <button
              key={opt.id}
              type="button"
              onClick={() => setSetup(opt.id)}
              className={`rounded-lg border px-3 py-2.5 text-left transition ${
                config.setup === opt.id
                  ? 'border-[var(--color-accent)] bg-[var(--color-accent)]/8 ring-1 ring-[var(--color-accent)]'
                  : 'border-[var(--color-line)] hover:border-[var(--color-muted)]'
              }`}
            >
              <div className="text-sm font-semibold">{opt.label}</div>
              <div className="mt-0.5 text-xs text-[var(--color-muted)]">{opt.description}</div>
            </button>
          ))}
        </div>
      </SectionCard>

      <SectionCard title="Walls">
        <WallControls side="back" label="Back wall" />
        <WallControls side="left" label="Left wall" />
        <WallControls side="right" label="Right wall" />
      </SectionCard>

      <SectionCard title="Edit panel">
        <div className="flex flex-wrap gap-1.5">
          {visible.map((s) => (
            <button
              key={s.id}
              type="button"
              onClick={() => {
                setSelectedSection(s.id)
                setViewMode('2d')
              }}
              className={`rounded-md px-2.5 py-1.5 text-xs font-medium transition ${
                selectedSectionId === s.id
                  ? 'bg-[var(--color-ink)] text-white'
                  : 'bg-[var(--color-canvas)] text-[var(--color-ink)] hover:bg-[var(--color-line)]'
              }`}
            >
              {s.label}
            </button>
          ))}
        </div>
      </SectionCard>

      <SectionCard title="Core colors">
        <div className="mb-2 flex flex-wrap gap-2">
          {canopyTentProduct.colors.map((c) => (
            <button
              key={c}
              type="button"
              title={c}
              onClick={() => setSectionColor(selectedSectionId, c)}
              className={`size-8 rounded-full border-2 transition ${
                section.fillColor.toLowerCase() === c.toLowerCase()
                  ? 'border-[var(--color-ink)] scale-110'
                  : 'border-white shadow ring-1 ring-[var(--color-line)]'
              }`}
              style={{ backgroundColor: c }}
            />
          ))}
        </div>
        <div className="flex items-center gap-2">
          <input
            type="color"
            value={section.fillColor}
            onChange={(e) => setSectionColor(selectedSectionId, e.target.value)}
            className="h-8 w-10 cursor-pointer rounded border border-[var(--color-line)] bg-transparent"
          />
          <button
            type="button"
            onClick={() => applyColorToAll(section.fillColor)}
            className="text-xs font-medium text-[var(--color-accent)] underline-offset-2 hover:underline"
          >
            Apply to all panels
          </button>
        </div>
      </SectionCard>

      <SectionCard title="Logo or graphic">
        <label className="flex cursor-pointer flex-col items-center justify-center rounded-lg border border-dashed border-[var(--color-line)] bg-[var(--color-paper)] px-3 py-5 text-center transition hover:border-[var(--color-accent)]">
          <span className="text-sm font-medium">Upload logo or graphic</span>
          <span className="mt-1 text-xs text-[var(--color-muted)]">SVG, PNG, JPG, or WebP</span>
          <input
            type="file"
            accept="image/png,image/jpeg,image/webp,image/svg+xml"
            className="hidden"
            onChange={(e) => onUpload(e.target.files?.[0] ?? null)}
          />
        </label>
        <button
          type="button"
          onClick={() => {
            addText(selectedSectionId)
            setViewMode('2d')
          }}
          className="mt-2 w-full rounded-lg border border-[var(--color-line)] px-3 py-2 text-sm font-medium hover:bg-[var(--color-paper)]"
        >
          Add text
        </button>
      </SectionCard>

      {selectedEl && (
        <SectionCard title="Selected element">
          {selectedEl.type === 'text' && (
            <div className="flex flex-col gap-2 text-sm">
              <label className="flex flex-col gap-1">
                Text
                <input
                  value={selectedEl.text}
                  onChange={(e) =>
                    updateElement(selectedSectionId, selectedEl.id, { text: e.target.value })
                  }
                  className="rounded border border-[var(--color-line)] px-2 py-1.5"
                />
              </label>
              <div className="grid grid-cols-2 gap-2">
                <label className="flex flex-col gap-1">
                  Size
                  <input
                    type="number"
                    min={12}
                    max={200}
                    value={selectedEl.fontSize}
                    onChange={(e) =>
                      updateElement(selectedSectionId, selectedEl.id, {
                        fontSize: Number(e.target.value),
                      })
                    }
                    className="rounded border border-[var(--color-line)] px-2 py-1.5"
                  />
                </label>
                <label className="flex flex-col gap-1">
                  Color
                  <input
                    type="color"
                    value={selectedEl.fill}
                    onChange={(e) =>
                      updateElement(selectedSectionId, selectedEl.id, { fill: e.target.value })
                    }
                    className="h-9 w-full cursor-pointer rounded border border-[var(--color-line)]"
                  />
                </label>
              </div>
            </div>
          )}
          {selectedEl.type === 'image' && (
            <p className="text-sm text-[var(--color-muted)] truncate">{selectedEl.name}</p>
          )}
          <button
            type="button"
            onClick={() => removeElement(selectedSectionId, selectedEl.id)}
            className="mt-3 w-full rounded-lg bg-red-50 px-3 py-2 text-sm font-medium text-red-700 hover:bg-red-100"
          >
            Remove element
          </button>
        </SectionCard>
      )}
    </div>
  )
}
