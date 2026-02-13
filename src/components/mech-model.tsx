'use client'

import { useEffect, useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { useGLTF } from '@react-three/drei'
import {
  Color,
  type Group,
  type Material,
  type Mesh,
  type Object3D,
} from 'three'
const ROTATION_SPEED = 0.002
const MECH_TINT = '#6b7cff'

function tintMaterials(object: Object3D, tintColor: Color): void {
  object.traverse((child) => {
    if ((child as Mesh).isMesh) {
      const mesh = child as Mesh
      const materials = Array.isArray(mesh.material)
        ? mesh.material
        : [mesh.material]
      const tinted = materials.map((mat: Material) => {
        if ('color' in mat && mat.color) {
          const cloned = mat.clone() as Material & { color: Color }
          cloned.color.copy(tintColor)
          return cloned
        }
        return mat
      })
      mesh.material = tinted.length === 1 ? tinted[0] : tinted
    }
  })
}

interface MechModelProps {
  url: string
  scale?: number
}

export function MechModel({ url, scale = 1 }: MechModelProps) {
  const groupRef = useRef<Group>(null)
  const { scene } = useGLTF(url)
  const tilt = useMemo(
    () => ({
      tiltAxisX: 0.2 + Math.random() * 0.1,
      tiltAxisZ: 0.08 + Math.random() * 0.14,
    }),
    [],
  )

  useEffect(() => {
    if (scene.userData.tintHex === MECH_TINT) return
    tintMaterials(scene, new Color(MECH_TINT))
    scene.userData.tintHex = MECH_TINT
  }, [scene])

  useFrame((state) => {
    if (groupRef.current) {
      groupRef.current.rotation.x = tilt.tiltAxisX
      groupRef.current.rotation.z = tilt.tiltAxisZ
      groupRef.current.rotation.y += ROTATION_SPEED
      state.invalidate()
    }
  })

  return (
    <group ref={groupRef} scale={scale} position={[0, -0.4, 0]}>
      <primitive object={scene} />
    </group>
  )
}
