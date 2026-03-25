'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { Canvas, useThree } from '@react-three/fiber'
import { useGLTF } from '@react-three/drei'
import { MechModel } from '@/components/mech-model'
import { useFactionTheme } from '@/components/faction-theme-provider'
import { factionMechTint } from '@/lib/faction-chart-colors'
import { MECH_URLS, FACTION_TO_MECH_URL } from '@/lib/mech-landing'

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
  const { activeFactionThemeId } = useFactionTheme()
  const mechUrl = FACTION_TO_MECH_URL[activeFactionThemeId]
  const mechTintHex = factionMechTint(activeFactionThemeId)

  const [canvasKey, setCanvasKey] = useState(0)
  const lastContextRemountRef = useRef(0)
  const contextRemountCountRef = useRef(0)

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
          key={mechUrl}
          url={mechUrl}
          scale={MECH_SCALE[mechUrl] ?? 1}
          tintHex={mechTintHex}
        />
      </Canvas>
    </div>
  )
}
