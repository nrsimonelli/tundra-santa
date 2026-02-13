'use client'

import { useCallback, useEffect, useState } from 'react'
import { Canvas } from '@react-three/fiber'
import { useGLTF } from '@react-three/drei'
import { MechModel } from '@/components/mech-model'

const MECH_URLS = [
  '/mechs/Albion_Mech.glb',
  '/mechs/Crimean_Mech.glb',
  '/mechs/Nordic_Mech.glb',
  '/mechs/Polania_Mech.glb',
  '/mechs/Rusviet_Mech.glb',
  '/mechs/Saxony_Mech.glb',
  '/mechs/Togawa_Mech.glb',
] as const

const MECH_SCALE: Partial<Record<(typeof MECH_URLS)[number], number>> = {
  '/mechs/Albion_Mech.glb': 0.4,
  '/mechs/Togawa_Mech.glb': 0.4,
}

MECH_URLS.forEach((url) => useGLTF.preload(url))

export default function LandingMechs() {
  const [mechUrl] = useState(
    () => MECH_URLS[Math.floor(Math.random() * MECH_URLS.length)],
  )
  const [canvasKey, setCanvasKey] = useState(0)

  const remountCanvas = useCallback(() => {
    setCanvasKey((k) => k + 1)
  }, [])

  useEffect(() => {
    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        remountCanvas()
      }
    }
    document.addEventListener('visibilitychange', handleVisibility)
    return () =>
      document.removeEventListener('visibilitychange', handleVisibility)
  }, [remountCanvas])

  const handleContextLost = useCallback(
    (e: Event) => {
      e.preventDefault()
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
        onCreated={({ gl }) => {
          gl.domElement.addEventListener('webglcontextlost', handleContextLost)
        }}
      >
        <ambientLight intensity={0.9} />
        <directionalLight position={[3, 3, 4]} intensity={3.2} />
        <directionalLight position={[-2, -1, 3]} intensity={0.25} />
        <MechModel url={mechUrl} scale={MECH_SCALE[mechUrl] ?? 1} />
      </Canvas>
    </div>
  )
}
