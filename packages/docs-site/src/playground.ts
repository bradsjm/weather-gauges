import { applyGaugeProps } from './gauge-utils'
import type { ControlDef, NormalizeState, PlaygroundState } from './types'

const renderControls = (
  container: HTMLElement,
  controls: ControlDef[],
  state: PlaygroundState,
  onChange: () => void
): void => {
  container.innerHTML = ''
  controls.forEach((control) => {
    const item = document.createElement('div')
    item.className = 'control-item'
    const inputId = `ctrl-${control.key}`
    const value = state[control.key]

    let inputMarkup = ''
    if (control.type === 'select') {
      inputMarkup = `<select id="${inputId}">${(control.options ?? [])
        .map(
          (option) =>
            `<option value="${option.value}" ${value === option.value ? 'selected' : ''}>${option.label}</option>`
        )
        .join('')}</select>`
    } else if (control.type === 'checkbox') {
      inputMarkup = `<div class="control-inline"><input id="${inputId}" type="checkbox" ${value ? 'checked' : ''} /><span>${value ? 'Enabled' : 'Disabled'}</span></div>`
    } else {
      const inputType = control.type === 'range' ? 'range' : control.type
      inputMarkup = `<input id="${inputId}" type="${inputType}" value="${value ?? ''}" ${control.min !== undefined ? `min="${control.min}"` : ''} ${control.max !== undefined ? `max="${control.max}"` : ''} ${control.step !== undefined ? `step="${control.step}"` : ''} />`
    }

    item.innerHTML = `
      <label for="${inputId}">${control.label}</label>
      <p>${control.description}</p>
      ${inputMarkup}
    `

    const input = item.querySelector(`#${inputId}`) as HTMLInputElement | HTMLSelectElement
    const handler = () => {
      if (control.type === 'checkbox') {
        state[control.key] = (input as HTMLInputElement).checked
      } else if (control.type === 'range' || control.type === 'number') {
        state[control.key] = Number(input.value)
      } else {
        state[control.key] = input.value
      }
      onChange()
    }

    input.addEventListener('input', handler)
    input.addEventListener('change', handler)
    container.append(item)
  })
}

const syncControlInputs = (
  container: HTMLElement,
  controls: ControlDef[],
  state: PlaygroundState
): void => {
  controls.forEach((control) => {
    const input = container.querySelector(`#ctrl-${control.key}`) as
      | HTMLInputElement
      | HTMLSelectElement
      | null
    if (!input) {
      return
    }

    if (control.type === 'checkbox') {
      const checkbox = input as HTMLInputElement
      checkbox.checked = Boolean(state[control.key])
      const status = checkbox.parentElement?.querySelector('span')
      if (status) {
        status.textContent = checkbox.checked ? 'Enabled' : 'Disabled'
      }
      return
    }

    if (input instanceof HTMLInputElement) {
      if (control.min !== undefined) {
        input.min = String(control.min)
      }
      if (control.max !== undefined) {
        input.max = String(control.max)
      }
      if (control.step !== undefined) {
        input.step = String(control.step)
      }
    }

    input.value = String(state[control.key] ?? '')
  })
}

const renderSettingReference = (
  container: HTMLElement,
  controls: ControlDef[],
  defaults: PlaygroundState
): void => {
  const docsForControl = (control: ControlDef): string => {
    const typeLabel =
      control.type === 'checkbox'
        ? 'boolean'
        : control.type === 'number' || control.type === 'range'
          ? 'number'
          : control.type === 'select'
            ? 'enum'
            : 'string'
    const bounds =
      control.type === 'number' || control.type === 'range'
        ? ` Range: ${control.min ?? '-inf'} to ${control.max ?? 'inf'}${control.step !== undefined ? ` (step ${control.step})` : ''}.`
        : ''
    const optionSummary =
      control.type === 'select'
        ? ` Allowed: ${(control.options ?? []).map((option) => option.value).join(', ')}.`
        : ''
    const extra = control.documentation ? ` ${control.documentation}` : ''
    return `Type: ${typeLabel}.${bounds}${optionSummary}${extra}`
  }

  const list = controls
    .map(
      (control) =>
        `<li><strong>${control.label}</strong> (<code>${control.key}</code>) - ${control.description} ${docsForControl(control)} Default: <code>${String(defaults[control.key])}</code></li>`
    )
    .join('')
  container.innerHTML = `<div class="setting-reference"><h4>Setting Reference</h4><ul>${list}</ul></div>`
}

export const renderPlaygroundPage = (
  root: HTMLElement,
  title: string,
  subtitle: string,
  gaugeTag: string,
  controls: ControlDef[],
  defaults: PlaygroundState,
  normalizeState?: NormalizeState
): void => {
  root.innerHTML = `
    <h1 class="page-title">${title}</h1>
    <p class="page-subtitle">${subtitle}</p>
    <div class="page-layout">
      <section class="gauge-panel">
        <div id="gauge-stage"></div>
        <pre class="state-preview" id="state-preview"></pre>
      </section>
      <section class="control-panel">
        <div class="control-grid" id="control-grid"></div>
        <div id="setting-reference"></div>
      </section>
    </div>
  `

  const state: PlaygroundState = { ...defaults }
  const stage = root.querySelector('#gauge-stage') as HTMLDivElement
  const preview = root.querySelector('#state-preview') as HTMLPreElement
  const controlGrid = root.querySelector('#control-grid') as HTMLDivElement
  const settingReference = root.querySelector('#setting-reference') as HTMLDivElement
  const gauge = document.createElement(gaugeTag)
  stage.append(gauge)

  const apply = () => {
    normalizeState?.(state, controls)
    syncControlInputs(controlGrid, controls, state)
    applyGaugeProps(gauge, { ...state, size: 360 })
    preview.textContent = JSON.stringify(state, null, 2)
  }

  renderControls(controlGrid, controls, state, apply)
  renderSettingReference(settingReference, controls, defaults)
  apply()
}
