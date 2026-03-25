/**
 * Recharts renders SVG with its own defaults; use these with tick / stroke props
 * so axes and grids follow CSS theme tokens.
 */

export const RECHARTS_TICK = {
  fill: 'hsl(var(--foreground))',
  fontSize: 12,
} as const

export const RECHARTS_TICK_SM = {
  fill: 'hsl(var(--foreground))',
  fontSize: 11,
} as const

export const RECHARTS_TICK_MUTED = {
  fill: 'hsl(var(--muted-foreground))',
  fontSize: 11,
} as const

export const RECHARTS_AXIS_STROKE = 'hsl(var(--border))'

export const RECHARTS_GRID_STROKE = 'hsl(var(--border))'

export const RECHARTS_LABEL_FILL = 'hsl(var(--foreground))'
