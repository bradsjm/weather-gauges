import '@bradsjm/steelseries-v3-elements'

export type SteelseriesCardConfig = {
  type: string
  entity?: string
  title?: string
}

declare global {
  interface Window {
    customCards?: Array<{
      type: string
      name: string
      description: string
      preview: boolean
    }>
  }
}

window.customCards = window.customCards || []
