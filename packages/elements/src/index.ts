import { LitElement, css, html } from 'lit'
import { customElement, property } from 'lit/decorators.js'

@customElement('steelseries-radial-v3')
export class SteelseriesRadialV3Element extends LitElement {
  static styles = css`
    :host {
      --ss3-font-family: system-ui, sans-serif;
      --ss3-text-color: #1f2937;
      --ss3-background-color: #f8fafc;
      display: inline-block;
      font-family: var(--ss3-font-family);
      color: var(--ss3-text-color);
    }

    .frame {
      border-radius: 9999px;
      background: var(--ss3-background-color);
      padding: 0.5rem;
      min-width: 180px;
      min-height: 180px;
      display: grid;
      place-items: center;
      box-sizing: border-box;
    }
  `

  @property({ type: Number })
  value = 0

  render() {
    return html`<div class="frame">v3 radial scaffold: ${this.value}</div>`
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'steelseries-radial-v3': SteelseriesRadialV3Element
  }
}
