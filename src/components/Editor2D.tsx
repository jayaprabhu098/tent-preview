import { useEffect, useRef, useState, useCallback } from 'react'
import { Stage, Layer, Rect, Text, Image as KonvaImage, Transformer } from 'react-konva'
import type Konva from 'konva'
import { useConfigStore } from '@/core/store'
import { canopyTentProduct } from '@/products/canopy-tent/definition'
import type { DesignElement, ImageElement } from '@/core/types'

function useHtmlImage(src: string | undefined) {
  const [image, setImage] = useState<HTMLImageElement | null>(null)
  useEffect(() => {
    if (!src) {
      setImage(null)
      return
    }
    const img = new window.Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => setImage(img)
    img.src = src
  }, [src])
  return image
}

function ImageNode({
  el,
  isSelected,
  onSelect,
  onChange,
}: {
  el: ImageElement
  isSelected: boolean
  onSelect: () => void
  onChange: (patch: Partial<ImageElement>) => void
}) {
  const image = useHtmlImage(el.src)
  const shapeRef = useRef<Konva.Image>(null)
  const trRef = useRef<Konva.Transformer>(null)

  useEffect(() => {
    if (isSelected && trRef.current && shapeRef.current) {
      trRef.current.nodes([shapeRef.current])
      trRef.current.getLayer()?.batchDraw()
    }
  }, [isSelected])

  return (
    <>
      <KonvaImage
        ref={shapeRef}
        image={image ?? undefined}
        x={el.transform.x}
        y={el.transform.y}
        width={el.transform.width}
        height={el.transform.height}
        scaleX={el.transform.scaleX}
        scaleY={el.transform.scaleY}
        rotation={el.transform.rotation}
        draggable
        onClick={onSelect}
        onTap={onSelect}
        onDragEnd={(e) => {
          onChange({
            transform: {
              ...el.transform,
              x: e.target.x(),
              y: e.target.y(),
            },
          })
        }}
        onTransformEnd={() => {
          const node = shapeRef.current
          if (!node) return
          const scaleX = node.scaleX()
          const scaleY = node.scaleY()
          node.scaleX(1)
          node.scaleY(1)
          onChange({
            transform: {
              ...el.transform,
              x: node.x(),
              y: node.y(),
              rotation: node.rotation(),
              width: Math.max(20, node.width() * scaleX),
              height: Math.max(20, node.height() * scaleY),
              scaleX: 1,
              scaleY: 1,
            },
          })
        }}
      />
      {isSelected && (
        <Transformer
          ref={trRef}
          rotateEnabled
          enabledAnchors={['top-left', 'top-right', 'bottom-left', 'bottom-right']}
        />
      )}
    </>
  )
}

function TextNode({
  el,
  isSelected,
  onSelect,
  onChange,
}: {
  el: Extract<DesignElement, { type: 'text' }>
  isSelected: boolean
  onSelect: () => void
  onChange: (patch: Partial<DesignElement>) => void
}) {
  const shapeRef = useRef<Konva.Text>(null)
  const trRef = useRef<Konva.Transformer>(null)

  useEffect(() => {
    if (isSelected && trRef.current && shapeRef.current) {
      trRef.current.nodes([shapeRef.current])
      trRef.current.getLayer()?.batchDraw()
    }
  }, [isSelected])

  return (
    <>
      <Text
        ref={shapeRef}
        text={el.text}
        fontSize={el.fontSize}
        fill={el.fill}
        fontFamily={el.fontFamily}
        x={el.transform.x}
        y={el.transform.y}
        width={el.transform.width}
        scaleX={el.transform.scaleX}
        scaleY={el.transform.scaleY}
        rotation={el.transform.rotation}
        draggable
        onClick={onSelect}
        onTap={onSelect}
        onDragEnd={(e) => {
          onChange({
            transform: {
              ...el.transform,
              x: e.target.x(),
              y: e.target.y(),
            },
          })
        }}
        onTransformEnd={() => {
          const node = shapeRef.current
          if (!node) return
          onChange({
            transform: {
              ...el.transform,
              x: node.x(),
              y: node.y(),
              rotation: node.rotation(),
              scaleX: node.scaleX(),
              scaleY: node.scaleY(),
              width: node.width(),
              height: node.height(),
            },
          })
        }}
      />
      {isSelected && <Transformer ref={trRef} rotateEnabled />}
    </>
  )
}

type Editor2DProps = {
  stageRef?: React.MutableRefObject<Konva.Stage | null>
}

export function Editor2D({ stageRef }: Editor2DProps) {
  const selectedSectionId = useConfigStore((s) => s.selectedSectionId)
  const selectedElementId = useConfigStore((s) => s.selectedElementId)
  const section = useConfigStore((s) => s.config.sections[s.selectedSectionId])
  const setSelectedElement = useConfigStore((s) => s.setSelectedElement)
  const updateElement = useConfigStore((s) => s.updateElement)

  const def = canopyTentProduct.sections.find((s) => s.id === selectedSectionId)!
  const containerRef = useRef<HTMLDivElement>(null)
  const [scale, setScale] = useState(1)
  const localStageRef = useRef<Konva.Stage>(null)

  const assignStage = useCallback(
    (node: Konva.Stage | null) => {
      localStageRef.current = node
      if (stageRef) stageRef.current = node
    },
    [stageRef],
  )

  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    const resize = () => {
      const pad = 32
      const availW = el.clientWidth - pad
      const availH = el.clientHeight - pad
      const s = Math.min(availW / def.width, availH / def.height, 1.2)
      setScale(s)
    }
    resize()
    const ro = new ResizeObserver(resize)
    ro.observe(el)
    return () => ro.disconnect()
  }, [def.width, def.height])

  return (
    <div
      ref={containerRef}
      className="flex h-full w-full items-center justify-center overflow-hidden bg-[var(--color-canvas)]"
      data-testid="editor-2d"
    >
      <Stage
        ref={assignStage}
        width={def.width * scale}
        height={def.height * scale}
        scaleX={scale}
        scaleY={scale}
        onMouseDown={(e) => {
          if (e.target === e.target.getStage()) setSelectedElement(null)
        }}
        className="shadow-lg ring-1 ring-[var(--color-line)]"
      >
        <Layer>
          <Rect
            x={0}
            y={0}
            width={def.width}
            height={def.height}
            fill={section.fillColor}
          />
          {section.elements.map((el) => {
            const selected = el.id === selectedElementId
            const onSelect = () => setSelectedElement(el.id)
            const onChange = (patch: Partial<DesignElement>) =>
              updateElement(selectedSectionId, el.id, patch)

            if (el.type === 'image') {
              return (
                <ImageNode
                  key={el.id}
                  el={el}
                  isSelected={selected}
                  onSelect={onSelect}
                  onChange={onChange}
                />
              )
            }
            return (
              <TextNode
                key={el.id}
                el={el}
                isSelected={selected}
                onSelect={onSelect}
                onChange={onChange}
              />
            )
          })}
        </Layer>
      </Stage>
    </div>
  )
}
