// Radial types only - renderer implementation removed
// These types are shared with compass and radial-bargraph

export type RadialDrawContext = CanvasRenderingContext2D

export type RadialRenderResult = {
  value: number
  tone: 'accent' | 'warning' | 'danger'
  activeAlerts: import('./schema.js').RadialAlert[]
}

export type RadialRenderOptions = {
  value?: number
  paint?: Partial<import('../theme/tokens.js').ThemePaint>
}

// Animation functions removed - radial gauge no longer implemented
// Use radial-bargraph or compass instead
