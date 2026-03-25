'use client'

import dynamic from 'next/dynamic'

const MECH_CANVAS_WRAPPER_CLASS =
  'relative z-[60] -mt-10 sm:-mt-16 md:-mt-28 w-full h-[220px] sm:h-[320px] md:h-[400px] flex items-center justify-center'

const LandingMechs = dynamic(() => import('@/components/landing-mechs'), {
  ssr: false,
  loading: () => <div className={MECH_CANVAS_WRAPPER_CLASS} />,
})

export function LandingMechsDynamic() {
  return <LandingMechs />
}
