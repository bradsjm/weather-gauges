import '@bradsjm/steelseries-v3-elements'

export type SteelseriesCardConfig = {
  type: string
  entity?: string
  title?: string
}

export class SteelseriesRadialCard extends HTMLElement {
  private _config?: SteelseriesCardConfig
  private _hass?: unknown

  setConfig(config: SteelseriesCardConfig): void {
    this._config = config
  }

  set hass(_hass: unknown) {
    this._hass = _hass
  }

  getCardSize(): number {
    return 3
  }

  getGridOptions(): { rows: number; columns: number } {
    return { rows: 4, columns: 6 }
  }

  connectedCallback(): void {
    if (!this.shadowRoot) {
      this.attachShadow({ mode: 'open' })
    }
    this.shadowRoot!.replaceChildren()
    const title = this._config?.title ?? 'SteelSeries v3'
    const card = document.createElement('ha-card')
    card.setAttribute('header', title)
    const gauge = document.createElement('steelseries-radial-v3')
    card.append(gauge)
    this.shadowRoot!.append(card)
  }
}

if (!customElements.get('steelseries-radial-card-v3')) {
  customElements.define('steelseries-radial-card-v3', SteelseriesRadialCard)
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
window.customCards.push({
  type: 'steelseries-radial-card-v3',
  name: 'SteelSeries Radial v3',
  description: 'Scaffolded SteelSeries v3 radial card',
  preview: true
})
