import { applyGaugeProps } from './gauge-utils'
import { buildFullJsSnippet, buildMinimalHtmlSnippet } from './snippets'
import { showToast } from './toast'
import type { ControlDef, NormalizeState, PlaygroundState } from './types'
import { decodeStateFromParam, encodeStateToParam } from './url-state'

const renderControls = (
  container: HTMLElement,
  controls: ControlDef[],
  state: PlaygroundState,
  defaults: PlaygroundState,
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
        ? ` Range ${control.min ?? '-inf'} to ${control.max ?? 'inf'}${control.step !== undefined ? ` (step ${control.step})` : ''}.`
        : ''
    const optionSummary =
      control.type === 'select'
        ? ` Options: ${(control.options ?? []).map((option) => option.value).join(', ')}.`
        : ''
    const defaultSummary = ` Default: ${String(defaults[control.key])}.`
    const extraDocs = control.documentation ? ` ${control.documentation}` : ''

    item.innerHTML = `
      <label for="${inputId}">${control.label}</label>
      <p>${control.description} Type: ${typeLabel}.${bounds}${optionSummary}${defaultSummary}${extraDocs}</p>
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

export const renderPlaygroundPage = (
  root: HTMLElement,
  title: string,
  subtitle: string,
  gaugeTag: string,
  controls: ControlDef[],
  defaults: PlaygroundState,
  normalizeState?: NormalizeState
): void => {
  const params = new URLSearchParams(window.location.search)
  const shared = params.get('s')
  const sharedState = shared ? decodeStateFromParam(shared) : null

  root.innerHTML = `
    <header class="page-head">
      <h1 class="page-title">${title}</h1>
      <p class="page-subtitle">${subtitle}</p>
      <div class="console-actions" role="group" aria-label="Playground actions">
        <button class="btn" type="button" data-action="copy-html">Copy HTML</button>
        <button class="btn" type="button" data-action="copy-js">Copy JS</button>
        <button class="btn" type="button" data-action="copy-json">Copy JSON</button>
        <button class="btn" type="button" data-action="share">Share Link</button>
        <button class="btn btn-ghost" type="button" data-action="reset">Reset</button>
      </div>
    </header>
    <div class="page-layout">
      <section class="gauge-panel">
        <div id="gauge-stage"></div>
        <div class="state-wrap">
          <button
            class="state-copy"
            type="button"
            data-action="copy-json-inline"
            aria-label="Copy JSON state"
            title="Copy JSON"
          >
            <svg class="icon" viewBox="0 0 24 24" aria-hidden="true">
              <path
                fill="currentColor"
                d="M16 1H6a2 2 0 0 0-2 2v12h2V3h10V1zm3 4H10a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h9a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2zm0 16H10V7h9v14z"
              />
            </svg>
          </button>
          <pre class="state-preview" id="state-preview"></pre>
        </div>
      </section>
      <section class="control-panel">
        <div class="control-grid" id="control-grid"></div>
      </section>
    </div>
  `

  const state: PlaygroundState = { ...defaults, ...(sharedState ?? {}) }
  const stage = root.querySelector('#gauge-stage') as HTMLDivElement
  const preview = root.querySelector('#state-preview') as HTMLPreElement
  const controlGrid = root.querySelector('#control-grid') as HTMLDivElement
  const gauge = document.createElement(gaugeTag)
  stage.append(gauge)

  const writeClipboard = async (text: string): Promise<boolean> => {
    try {
      await navigator.clipboard.writeText(text)
      return true
    } catch {
      return false
    }
  }

  const setSharedParam = (): void => {
    const encoded = encodeStateToParam(state)
    const next = new URL(window.location.href)
    next.searchParams.set('s', encoded)
    window.history.replaceState({}, '', next)
  }

  const clearSharedParam = (): void => {
    const next = new URL(window.location.href)
    next.searchParams.delete('s')
    window.history.replaceState({}, '', next)
  }

  const apply = () => {
    normalizeState?.(state, controls)
    syncControlInputs(controlGrid, controls, state)
    applyGaugeProps(gauge, { ...state, size: 360 })
    preview.textContent = JSON.stringify(state, null, 2)
  }

  const bindActions = (): void => {
    root.querySelectorAll<HTMLButtonElement>('button[data-action]').forEach((button) => {
      button.addEventListener('click', async () => {
        const action = button.getAttribute('data-action')
        if (!action) {
          return
        }

        if (action === 'copy-html') {
          const snippet = buildMinimalHtmlSnippet(gaugeTag, state)
          const ok = await writeClipboard(snippet)
          showToast(
            ok ? 'Copied minimal HTML snippet.' : 'Copy failed (clipboard not available).',
            ok ? 'info' : 'warning'
          )
          return
        }

        if (action === 'copy-js') {
          const snippet = buildFullJsSnippet(gaugeTag, state)
          const ok = await writeClipboard(snippet)
          showToast(
            ok ? 'Copied JS snippet.' : 'Copy failed (clipboard not available).',
            ok ? 'info' : 'warning'
          )
          return
        }

        if (action === 'copy-json') {
          const snippet = JSON.stringify(state, null, 2)
          const ok = await writeClipboard(snippet)
          showToast(
            ok ? 'Copied JSON state.' : 'Copy failed (clipboard not available).',
            ok ? 'info' : 'warning'
          )
          return
        }

        if (action === 'copy-json-inline') {
          const snippet = JSON.stringify(state, null, 2)
          const ok = await writeClipboard(snippet)
          showToast(
            ok ? 'Copied JSON state.' : 'Copy failed (clipboard not available).',
            ok ? 'info' : 'warning'
          )
          return
        }

        if (action === 'share') {
          setSharedParam()
          const ok = await writeClipboard(window.location.href)
          showToast(ok ? 'Copied share link.' : 'Share link set in URL.', 'info')
          return
        }

        if (action === 'reset') {
          Object.keys(state).forEach((key) => {
            delete state[key]
          })
          Object.assign(state, defaults)
          clearSharedParam()
          apply()
          showToast('Reset to defaults.', 'info')
        }
      })
    })
  }

  renderControls(controlGrid, controls, state, defaults, apply)
  apply()
  bindActions()
}
