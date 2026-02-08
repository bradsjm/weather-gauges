import { LitElement, css, html } from 'lit'
import { customElement, property } from 'lit/decorators.js'

@customElement('steelseries-radial-v3')
export class SteelseriesRadialV3Element extends LitElement {
  static override styles = css`
    :host {
      --ss3-font-family: system-ui, sans-serif;
      --ss3-text-color: #1f2937;
      --ss3-background-color: #f8fafc;
      --ss3-frame-color: #dbe4ee;
      --ss3-accent-color: #0f766e;
      --ss3-warning-color: #b45309;
      --ss3-danger-color: #b91c1c;
      display: inline-block;
      font-family: var(--ss3-font-family);
      color: var(--ss3-text-color);
    }

    .frame {
      border-radius: 9999px;
      background: var(--ss3-frame-color);
      padding: 0.5rem;
      min-width: 180px;
      min-height: 180px;
      display: grid;
      place-items: center;
      box-sizing: border-box;
    }

    .dial {
      width: 100%;
      height: 100%;
      border-radius: inherit;
      background: var(--ss3-background-color);
      display: grid;
      place-items: center;
      text-align: center;
      box-sizing: border-box;
      padding: 0.75rem;
      gap: 0.35rem;
    }

    .label {
      font-size: 0.7rem;
      letter-spacing: 0.08em;
      text-transform: uppercase;
      opacity: 0.78;
    }

    .value {
      font-size: 1.1rem;
      font-variant-numeric: tabular-nums;
      font-weight: 600;
    }

    .dial.accent .value {
      color: var(--ss3-accent-color);
    }

    .dial.warning .value {
      color: var(--ss3-warning-color);
    }

    .dial.danger .value {
      color: var(--ss3-danger-color);
    }
  `

  @property({ type: Number })
  value = 0

  override render() {
    const tone = this.value >= 90 ? 'danger' : this.value >= 75 ? 'warning' : 'accent'

    return html`
      <div class="frame">
        <div class="dial ${tone}">
          <span class="label">radial scaffold</span>
          <span class="value">${this.value}</span>
        </div>
      </div>
    `
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'steelseries-radial-v3': SteelseriesRadialV3Element
  }
}
