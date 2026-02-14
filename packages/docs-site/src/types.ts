export type Route =
  | '/'
  | '/start-here'
  | '/concepts'
  | '/theming'
  | '/integrations'
  | '/troubleshooting'
  | '/radial'
  | '/radial-bargraph'
  | '/compass'
  | '/wind-direction'
  | '/wind-rose'

export type SelectOption = { value: string; label: string }

export type ControlType = 'range' | 'number' | 'text' | 'select' | 'checkbox'

export type ControlDef = {
  key: string
  label: string
  description: string
  type: ControlType
  min?: number
  max?: number
  step?: number
  options?: SelectOption[]
  documentation?: string
}

export type PlaygroundState = Record<string, unknown>

export type NormalizeState = (state: PlaygroundState, controls: ControlDef[]) => void
