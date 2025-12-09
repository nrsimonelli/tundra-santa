import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Extracts the year from a date string
 */
export function getYear(date: string | null): string | null {
  if (!date) return null
  return new Date(date).getFullYear().toString()
}

/**
 * Formats a date string to a readable format (e.g., "Jan 15, 2024")
 */
export function getFormattedDate(date: string | null): string | null {
  if (!date) return null
  return new Date(date).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

export function removeYearFromEventName(name: string | null): string {
  if (!name) return 'Unnamed Event'

  // Remove years in various formats:
  // - "Event 2023" or "Event 2023" at the end
  // - "Event (2023)" or "Event (2023)" with parentheses
  // - "2023 Event" or "2023 Event" at the start
  // - "'23 Event" or "Event '23" with apostrophe
  // - "Event - 2023" or "Event - 2023" with dash
  // Years from 2000-2099
  return name
    .replace(/\s*\(?\s*(20\d{2})\s*\)?\s*/g, ' ') // Remove (2023) or 2023 in parentheses
    .replace(/\s*(20\d{2})\s*/g, ' ') // Remove standalone 20XX years
    .replace(/\s*[''](\d{2})\s*/g, ' ') // Remove '23 or '23 formats
    .replace(/\s*-\s*(20\d{2})\s*/g, ' ') // Remove - 2023 formats
    .replace(/\s+/g, ' ') // Normalize multiple spaces
    .trim()
}
