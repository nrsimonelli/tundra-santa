'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { Canvas, useThree } from '@react-three/fiber'
import { useGLTF } from '@react-three/drei'
import { MechModel } from '@/components/mech-model'
import { factionMechTint } from '@/lib/faction-chart-colors'

const MECH_URLS = [
  '/mechs/Albion_Mech.glb',
  '/mechs/Crimean_Mech.glb',
  '/mechs/Nordic_Mech.glb',
  '/mechs/Polania_Mech.glb',
  '/mechs/Rusviet_Mech.glb',
  '/mechs/Saxony_Mech.glb',
  '/mechs/Togawa_Mech.glb',
] as const

const MECH_URL_TO_FACTION: Record<(typeof MECH_URLS)[number], string> = {
  '/mechs/Albion_Mech.glb': 'albion',
  '/mechs/Crimean_Mech.glb': 'crimea',
  '/mechs/Nordic_Mech.glb': 'nordic',
  '/mechs/Polania_Mech.glb': 'polania',
  '/mechs/Rusviet_Mech.glb': 'rusviet',
  '/mechs/Saxony_Mech.glb': 'saxony',
  '/mechs/Togawa_Mech.glb': 'togawa',
}

const MECH_SCALE: Partial<Record<(typeof MECH_URLS)[number], number>> = {
  '/mechs/Albion_Mech.glb': 0.4,
  '/mechs/Togawa_Mech.glb': 0.4,
}

const CONTEXT_LOST_REMOUNT_COOLDOWN_MS = 2500
const CONTEXT_LOST_MAX_REMOUNTS = 5

MECH_URLS.forEach((url) => useGLTF.preload(url))

function WebGLContextLostHandler({
  onContextLost,
}: {
  onContextLost: (e: Event) => void
}) {
  const gl = useThree((s) => s.gl)
  useEffect(() => {
    const canvas = gl.domElement
    canvas.addEventListener('webglcontextlost', onContextLost)
    return () => canvas.removeEventListener('webglcontextlost', onContextLost)
  }, [gl, onContextLost])
  return null
}

export default function LandingMechs() {
  const [mechUrl] = useState(
    () => MECH_URLS[Math.floor(Math.random() * MECH_URLS.length)],
  )
  const [canvasKey, setCanvasKey] = useState(0)
  const lastContextRemountRef = useRef(0)
  const contextRemountCountRef = useRef(0)

  const mechFaction = MECH_URL_TO_FACTION[mechUrl]
  const mechTintHex = factionMechTint(mechFaction)

  const remountCanvas = useCallback(() => {
    setCanvasKey((k) => k + 1)
  }, [])

  const handleContextLost = useCallback(
    (e: Event) => {
      e.preventDefault()
      const now = Date.now()
      if (
        now - lastContextRemountRef.current < CONTEXT_LOST_REMOUNT_COOLDOWN_MS
      ) {
        return
      }
      if (contextRemountCountRef.current >= CONTEXT_LOST_MAX_REMOUNTS) {
        return
      }
      lastContextRemountRef.current = now
      contextRemountCountRef.current += 1
      remountCanvas()
    },
    [remountCanvas],
  )

  return (
    <div className='relative z-[60] -mt-28 w-full h-[400px]'>
      <Canvas
        key={canvasKey}
        camera={{ position: [0, 0, 4], fov: 45 }}
        frameloop='always'
        dpr={[1, 2]}
        gl={{ antialias: true }}
      >
        <WebGLContextLostHandler onContextLost={handleContextLost} />
        <ambientLight intensity={0.9} />
        <directionalLight position={[3, 3, 4]} intensity={3.2} />
        <directionalLight position={[-2, -1, 3]} intensity={0.25} />
        <MechModel
          url={mechUrl}
          scale={MECH_SCALE[mechUrl] ?? 1}
          tintHex={mechTintHex}
        />
      </Canvas>
    </div>
  )
}
