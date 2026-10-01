import { Component, Suspense, type ReactNode, useEffect, useMemo, useRef } from 'react'
import { Canvas } from '@react-three/fiber'
import { OrbitControls, Environment, ContactShadows, useGLTF, Center } from '@react-three/drei'
import * as THREE from 'three'
import { useConfigStore } from '@/core/store'
import { canopyTentProduct } from '@/products/canopy-tent/definition'
import { renderSectionToCanvas } from '@/utils/sectionCanvas'
import type { SectionId, TentConfig } from '@/core/types'

function classifyMesh(name: string): SectionId | 'frame' | 'ignore' {
  const n = name.toLowerCase()
  if (/frame|pole|leg|metal|alu|hardware|bag/.test(n)) return 'frame'
  if (/wall|side|banner/.test(n)) {
    if (/back|rear/.test(n)) return 'wall_back'
    if (/left|l_/.test(n)) return 'wall_left'
    if (/right|r_/.test(n)) return 'wall_right'
    return 'wall_back'
  }
  if (/valance|skirt|apron/.test(n)) {
    if (/front|f_/.test(n)) return 'valance_front'
    if (/back|rear/.test(n)) return 'valance_back'
    if (/left/.test(n)) return 'valance_left'
    if (/right/.test(n)) return 'valance_right'
    return 'valance_front'
  }
  if (/canopy|top|roof|fabric|cloth|peak|panel/.test(n)) return 'canopy'
  return 'canopy'
}

function TentModel({ config }: { config: TentConfig }) {
  const { scene } = useGLTF(canopyTentProduct.modelUrl)
  const root = useMemo(() => scene.clone(true), [scene])
  const textureCache = useRef<Map<string, THREE.CanvasTexture>>(new Map())

  useEffect(() => {
    let cancelled = false

    async function apply() {
      const sectionIds = Object.keys(config.sections) as SectionId[]
      const canvases = new Map<SectionId, HTMLCanvasElement>()

      await Promise.all(
        sectionIds.map(async (id) => {
          const canvas = await renderSectionToCanvas(config.sections[id], 512, 512)
          canvases.set(id, canvas)
        }),
      )
      if (cancelled) return

      const mats = textureCache.current
      for (const [id, canvas] of canvases) {
        let tex = mats.get(id)
        if (!tex) {
          tex = new THREE.CanvasTexture(canvas)
          tex.colorSpace = THREE.SRGBColorSpace
          tex.flipY = false
          mats.set(id, tex)
        } else {
          tex.image = canvas
          tex.needsUpdate = true
        }
      }

      root.traverse((obj) => {
        const mesh = obj as THREE.Mesh
        if (!mesh.isMesh) return
        const kind = classifyMesh(mesh.name || mesh.parent?.name || '')

        if (kind === 'frame') {
          const mat = Array.isArray(mesh.material) ? mesh.material[0] : mesh.material
          if (mat && 'color' in mat) {
            ;(mat as THREE.MeshStandardMaterial).color.set('#C0C4C8')
            ;(mat as THREE.MeshStandardMaterial).metalness = 0.7
            ;(mat as THREE.MeshStandardMaterial).roughness = 0.35
          }
          mesh.visible = config.setup === 'canopy_frame'
          return
        }

        if (kind === 'ignore') return

        if (kind.startsWith('wall_')) {
          const side = kind.replace('wall_', '') as 'back' | 'left' | 'right'
          mesh.visible = config.walls[side] != null
          if (config.walls[side]?.height === 'half') {
            mesh.scale.setY(0.5)
          } else {
            mesh.scale.setY(1)
          }
        }

        const section = config.sections[kind as SectionId]
        if (!section) return

        const tex = mats.get(kind as SectionId)
        const base = Array.isArray(mesh.material) ? mesh.material[0] : mesh.material
        if (!base) return

        const mat = (base as THREE.MeshStandardMaterial).clone()
        mat.color.set(section.fillColor)
        if (tex && section.elements.length > 0) {
          mat.map = tex
          mat.color.set('#ffffff')
        } else {
          mat.map = null
        }
        mat.needsUpdate = true
        mesh.material = mat
      })
    }

    apply()
    return () => {
      cancelled = true
    }
  }, [config, root])

  return (
    <Center>
      <primitive object={root} scale={1} />
    </Center>
  )
}

export function TentFallback({ config }: { config: TentConfig }) {
  const color = config.sections.canopy.fillColor
  const showBack = config.walls.back != null
  const showLeft = config.walls.left != null
  const showRight = config.walls.right != null
  const half = (side: 'back' | 'left' | 'right') =>
    config.walls[side]?.height === 'half' ? 0.9 : 1.8

  return (
    <group>
      <mesh position={[0, 2.2, 0]}>
        <coneGeometry args={[2.2, 1.2, 4]} />
        <meshStandardMaterial color={color} flatShading />
      </mesh>
      <mesh position={[0, 1.55, 0]}>
        <boxGeometry args={[3.6, 0.35, 3.6]} />
        <meshStandardMaterial color={config.sections.valance_front.fillColor} />
      </mesh>
      {config.setup === 'canopy_frame' &&
        (
          [
            [-1.6, 0.9, -1.6],
            [1.6, 0.9, -1.6],
            [-1.6, 0.9, 1.6],
            [1.6, 0.9, 1.6],
          ] as [number, number, number][]
        ).map((p, i) => (
          <mesh key={i} position={p}>
            <cylinderGeometry args={[0.05, 0.05, 1.8, 8]} />
            <meshStandardMaterial color="#C0C4C8" metalness={0.7} roughness={0.3} />
          </mesh>
        ))}
      {showBack && (
        <mesh position={[0, half('back') / 2, -1.75]}>
          <boxGeometry args={[3.5, half('back'), 0.04]} />
          <meshStandardMaterial color={config.sections.wall_back.fillColor} />
        </mesh>
      )}
      {showLeft && (
        <mesh position={[-1.75, half('left') / 2, 0]} rotation={[0, Math.PI / 2, 0]}>
          <boxGeometry args={[3.5, half('left'), 0.04]} />
          <meshStandardMaterial color={config.sections.wall_left.fillColor} />
        </mesh>
      )}
      {showRight && (
        <mesh position={[1.75, half('right') / 2, 0]} rotation={[0, -Math.PI / 2, 0]}>
          <boxGeometry args={[3.5, half('right'), 0.04]} />
          <meshStandardMaterial color={config.sections.wall_right.fillColor} />
        </mesh>
      )}
    </group>
  )
}

class ModelErrorBoundary extends Component<
  { fallback: ReactNode; children: ReactNode },
  { error: boolean }
> {
  state = { error: false }
  static getDerivedStateFromError() {
    return { error: true }
  }
  render() {
    if (this.state.error) return this.props.fallback
    return this.props.children
  }
}

function Scene() {
  const config = useConfigStore((s) => s.config)

  return (
    <>
      <ambientLight intensity={0.55} />
      <directionalLight position={[5, 8, 3]} intensity={1.1} castShadow />
      <directionalLight position={[-3, 4, -2]} intensity={0.35} />
      <ModelErrorBoundary fallback={<TentFallback config={config} />}>
        <Suspense fallback={<TentFallback config={config} />}>
          <TentModel config={config} />
        </Suspense>
      </ModelErrorBoundary>
      <ContactShadows position={[0, 0, 0]} opacity={0.35} scale={12} blur={2.5} />
      <Environment preset="city" />
      <OrbitControls
        makeDefault
        minPolarAngle={0.2}
        maxPolarAngle={Math.PI / 2.05}
        minDistance={3}
        maxDistance={14}
        target={[0, 1.2, 0]}
      />
    </>
  )
}

type Preview3DProps = {
  canvasRef?: React.MutableRefObject<HTMLCanvasElement | null>
}

export function Preview3D({ canvasRef }: Preview3DProps) {
  return (
    <div
      className="relative h-full w-full bg-gradient-to-b from-[#dfe8ef] to-[var(--color-canvas)]"
      data-testid="preview-3d"
    >
      <Canvas
        shadows
        camera={{ position: [5, 3.5, 5], fov: 42 }}
        gl={{ preserveDrawingBuffer: true, antialias: true }}
        onCreated={({ gl }) => {
          if (canvasRef) canvasRef.current = gl.domElement
        }}
      >
        <Scene />
      </Canvas>
      <div className="pointer-events-none absolute bottom-3 left-3 rounded bg-black/40 px-2 py-1 text-xs text-white">
        Drag to orbit · Scroll to zoom
      </div>
    </div>
  )
}

useGLTF.preload(canopyTentProduct.modelUrl)
