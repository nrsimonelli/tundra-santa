import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function getFormattedDate(dateString: string | null): string {
  if (!dateString) return ''
  try {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
  } catch {
    return dateString
  }
}

export function getNumericDate(dateString: string | null): string {
  if (!dateString) return ''
  try {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    })
  } catch {
    return dateString
  }
}

export function removeYearFromEventName(name: string | null): string {
  if (!name) return ''

  return (
    name
      // Remove year in parentheses anywhere (most common pattern) - do this first
      .replace(/\s*\((201[6-9]|20[2-9]\d)\)\s*/g, ' ')
      // Remove year at start with optional dash
      .replace(/^(201[6-9]|20[2-9]\d)\s*[-–—]?\s*/g, '')
      // Remove year at end with dash/comma separator (including the separator)
      .replace(/\s*[-–—,]\s*(201[6-9]|20[2-9]\d)\s*$/g, '')
      // Remove year at end with space
      .replace(/\s+(201[6-9]|20[2-9]\d)\s*$/g, '')
      // Remove year at start with space
      .replace(/^(201[6-9]|20[2-9]\d)\s+/g, '')
      // Remove year in middle with space (e.g., "Tournament 2024 Finals")
      .replace(/\s+(201[6-9]|20[2-9]\d)\s+/g, ' ')
      // Clean up multiple spaces
      .replace(/\s+/g, ' ')
      .trim()
  )
}
