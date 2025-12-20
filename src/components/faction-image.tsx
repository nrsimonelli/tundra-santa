import Image from 'next/image'
import { cn } from '@/lib/utils'

import albionImage from '@/assets/factions/albion.png'
import crimeaImage from '@/assets/factions/crimea.png'
import nordicImage from '@/assets/factions/nordic.png'
import polaniaImage from '@/assets/factions/polania.png'
import rusvietImage from '@/assets/factions/rusviet.png'
import saxonyImage from '@/assets/factions/saxony.png'
import togawaImage from '@/assets/factions/togawa.png'

const factionImages: Record<string, typeof albionImage> = {
  albion: albionImage,
  crimea: crimeaImage,
  nordic: nordicImage,
  polania: polaniaImage,
  rusviet: rusvietImage,
  saxony: saxonyImage,
  togawa: togawaImage,
}

interface FactionImageProps {
  faction: string | null | undefined
  className?: string
  alt?: string
}

export function FactionImage({
  faction,
  className,
  alt,
}: FactionImageProps) {
  if (!faction) {
    return null
  }

  const normalizedFaction = faction.toLowerCase()
  const image = factionImages[normalizedFaction]

  if (!image) {
    return null
  }

  return (
    <Image
      src={image}
      alt={alt || `${faction} faction`}
      width={32}
      height={32}
      className={cn('inline-block', className)}
    />
  )
}

