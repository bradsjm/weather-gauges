import '@bradsjm/steelseries-v3-elements'

type Route = '/' | '/radial' | '/radial-bargraph' | '/compass' | '/wind-direction'

type SelectOption = { value: string; label: string }

type ControlType = 'range' | 'number' | 'text' | 'select' | 'checkbox'

type ControlDef = {
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

const app = document.querySelector<HTMLDivElement>('#app')

const frameOptions: SelectOption[] = [
  'blackMetal',
  'metal',
  'shinyMetal',
  'brass',
  'steel',
  'chrome',
  'gold',
  'anthracite',
  'tiltedGray',
  'tiltedBlack',
  'glossyMetal'
].map((value) => ({ value, label: value }))

const backgroundOptions: SelectOption[] = [
  'DARK_GRAY',
  'SATIN_GRAY',
  'LIGHT_GRAY',
  'WHITE',
  'BLACK',
  'BEIGE',
  'BROWN',
  'RED',
  'GREEN',
  'BLUE',
  'ANTHRACITE',
  'MUD',
  'PUNCHED_SHEET',
  'CARBON',
  'STAINLESS',
  'BRUSHED_METAL',
  'BRUSHED_STAINLESS',
  'TURNED'
].map((value) => ({ value, label: value }))

const pointerTypeOptions: SelectOption[] = [
  { value: 'type1', label: 'type1 - Classic compass needle' },
  { value: 'type2', label: 'type2 - Slim angular needle' },
  { value: 'type3', label: 'type3 - Thin bar needle' },
  { value: 'type4', label: 'type4 - Diamond spear needle' },
  { value: 'type5', label: 'type5 - Triangular split needle' },
  { value: 'type6', label: 'type6 - Forked center needle' },
  { value: 'type7', label: 'type7 - Simple triangular needle' },
  { value: 'type8', label: 'type8 - Curved classic needle' },
  { value: 'type9', label: 'type9 - Heavy metallic needle' },
  { value: 'type10', label: 'type10 - Teardrop bulb needle' },
  { value: 'type11', label: 'type11 - Curved tail needle' },
  { value: 'type12', label: 'type12 - Narrow spike needle' },
  { value: 'type13', label: 'type13 - Label-tip marker needle' },
  { value: 'type14', label: 'type14 - Metallic marker needle' },
  { value: 'type15', label: 'type15 - Ornate ring-base needle' },
  { value: 'type16', label: 'type16 - Ring-base bar-tail needle' }
]

const pointerColorOptions: SelectOption[] = [
  'RED',
  'GREEN',
  'BLUE',
  'ORANGE',
  'YELLOW',
  'CYAN',
  'MAGENTA',
  'WHITE',
  'GRAY',
  'BLACK',
  'RAITH',
  'GREEN_LCD',
  'JUG_GREEN'
].map((value) => ({ value, label: value }))

const foregroundTypeOptions: SelectOption[] = [
  { value: 'type1', label: 'type1 - Classic top highlight' },
  { value: 'type2', label: 'type2 - Wide dome highlight' },
  { value: 'type3', label: 'type3 - Deep arc highlight' },
  { value: 'type4', label: 'type4 - Lens + side flare' },
  { value: 'type5', label: 'type5 - Curved sweep highlight' }
]

const gaugeTypeOptions: SelectOption[] = [
  { value: 'type1', label: 'type1 - Quarter arc (90 deg)' },
  { value: 'type2', label: 'type2 - Half arc (180 deg)' },
  { value: 'type3', label: 'type3 - Three-quarter arc (270 deg)' },
  { value: 'type4', label: 'type4 - Full arc with free area' }
]

const radialGaugeTypeOptions: SelectOption[] = [
  ...gaugeTypeOptions,
  { value: 'type5', label: 'type5 - Radial vertical (legacy style)' }
]

const orientationOptions: SelectOption[] = [
  { value: 'north', label: 'north - Arc at top' },
  { value: 'east', label: 'east - Arc at right' },
  { value: 'west', label: 'west - Arc at left' }
]

const knobTypeOptions: SelectOption[] = ['standardKnob', 'metalKnob'].map((value) => ({
  value,
  label: value
}))

const knobStyleOptions: SelectOption[] = ['black', 'brass', 'silver'].map((value) => ({
  value,
  label: value
}))

const lcdColorOptions: SelectOption[] = [
  'STANDARD',
  'STANDARD_GREEN',
  'BLUE',
  'ORANGE',
  'RED',
  'YELLOW',
  'WHITE',
  'GRAY',
  'BLACK'
].map((value) => ({ value, label: value }))

const rootStyles = `
  .docs-shell {
    min-height: 100vh;
    background: linear-gradient(145deg, #f6f3ec 0%, #e8eef6 60%, #f7f9fc 100%);
    color: #10243a;
    font-family: 'Avenir Next', 'Gill Sans', 'Trebuchet MS', sans-serif;
  }
  .docs-nav {
    display: flex;
    gap: 0.65rem;
    padding: 1rem 1.25rem;
    border-bottom: 1px solid rgba(16, 36, 58, 0.12);
    backdrop-filter: blur(2px);
    position: sticky;
    top: 0;
    background: rgba(247, 249, 252, 0.92);
    z-index: 2;
  }
  .docs-nav a {
    text-decoration: none;
    color: #284766;
    font-weight: 600;
    letter-spacing: 0.02em;
    padding: 0.45rem 0.7rem;
    border-radius: 999px;
  }
  .docs-nav a.active {
    background: #284766;
    color: #f6f8fb;
  }
  .docs-main {
    padding: 1.5rem;
    max-width: 1320px;
    margin: 0 auto;
  }
  .page-title {
    margin: 0 0 0.35rem;
    font-size: 1.45rem;
    letter-spacing: 0.01em;
  }
  .page-subtitle {
    margin: 0 0 1.25rem;
    color: #355577;
    max-width: 78ch;
  }
  .index-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
    gap: 1rem;
  }
  .demo-card {
    background: #ffffff;
    border: 1px solid rgba(16, 36, 58, 0.12);
    border-radius: 16px;
    padding: 0.9rem;
    box-shadow: 0 10px 24px rgba(16, 36, 58, 0.08);
  }
  .demo-card h3 {
    margin: 0 0 0.35rem;
    font-size: 0.86rem;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    color: #3a5e80;
  }
  .demo-stage {
    min-height: 235px;
    display: grid;
    place-items: center;
  }
  .page-layout {
    display: grid;
    grid-template-columns: minmax(380px, 520px) minmax(320px, 1fr);
    gap: 1rem;
    align-items: start;
  }
  .gauge-panel,
  .control-panel {
    background: #ffffff;
    border: 1px solid rgba(16, 36, 58, 0.12);
    border-radius: 16px;
    padding: 1rem;
    box-shadow: 0 10px 24px rgba(16, 36, 58, 0.08);
  }
  .gauge-panel {
    display: grid;
    gap: 0.75rem;
    justify-items: center;
  }
  .control-grid {
    display: grid;
    gap: 0.6rem;
  }
  .control-item {
    border: 1px solid rgba(30, 55, 81, 0.16);
    border-radius: 10px;
    padding: 0.55rem 0.65rem;
    background: #f8fbff;
  }
  .control-item label {
    display: block;
    font-weight: 700;
    color: #1f4363;
    margin-bottom: 0.2rem;
  }
  .control-item p {
    margin: 0.2rem 0 0.45rem;
    font-size: 0.8rem;
    color: #476789;
  }
  .control-item input,
  .control-item select {
    width: 100%;
    box-sizing: border-box;
    border: 1px solid rgba(16, 36, 58, 0.25);
    border-radius: 8px;
    padding: 0.35rem 0.45rem;
    font: inherit;
    color: #10243a;
    background: #ffffff;
  }
  .control-item input[type='checkbox'] {
    width: auto;
    transform: scale(1.1);
    margin-right: 0.55rem;
  }
  .control-inline {
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }
  .setting-reference {
    margin-top: 0.9rem;
    border-top: 1px dashed rgba(16, 36, 58, 0.2);
    padding-top: 0.8rem;
  }
  .setting-reference h4 {
    margin: 0 0 0.45rem;
    font-size: 0.86rem;
    text-transform: uppercase;
    letter-spacing: 0.07em;
    color: #3a5e80;
  }
  .setting-reference ul {
    margin: 0;
    padding-left: 1rem;
    display: grid;
    gap: 0.35rem;
  }
  .setting-reference li {
    font-size: 0.82rem;
    color: #244260;
  }
  .state-preview {
    margin: 0;
    width: 100%;
    background: #0d1d2b;
    color: #d6e3f0;
    border-radius: 10px;
    padding: 0.7rem;
    font-size: 0.72rem;
    overflow: auto;
  }
  .card-link {
    margin-top: 0.55rem;
    display: inline-block;
    color: #214e73;
    font-weight: 700;
    text-decoration: none;
  }
  @media (max-width: 980px) {
    .page-layout {
      grid-template-columns: 1fr;
    }
  }
`

const currentRoute = (): Route => {
  const path = window.location.pathname
  if (
    path === '/radial' ||
    path === '/radial-bargraph' ||
    path === '/compass' ||
    path === '/wind-direction'
  ) {
    return path
  }
  return '/'
}

const renderShell = (route: Route): string => {
  const links: Array<{ path: Route; label: string }> = [
    { path: '/', label: 'Index' },
    { path: '/radial', label: 'Radial' },
    { path: '/radial-bargraph', label: 'Radial Bargraph' },
    { path: '/compass', label: 'Compass' },
    { path: '/wind-direction', label: 'Wind Direction' }
  ]

  return `
    <style>${rootStyles}</style>
    <div class="docs-shell">
      <nav class="docs-nav">
        ${links
          .map(
            (link) =>
              `<a href="${link.path}" data-nav="true" class="${route === link.path ? 'active' : ''}">${link.label}</a>`
          )
          .join('')}
      </nav>
      <main class="docs-main" id="page-root"></main>
    </div>
  `
}

const applyGaugeProps = (element: Element | null, props: Record<string, unknown>): void => {
  if (!element) {
    return
  }

  const target = element as unknown as Record<string, unknown>
  for (const [key, value] of Object.entries(props)) {
    target[key] = value
  }
}

const clampNumber = (value: number, min: number, max: number): number =>
  Math.min(max, Math.max(min, value))

const asFiniteNumber = (value: unknown, fallback: number): number =>
  typeof value === 'number' && Number.isFinite(value) ? value : fallback

const renderIndexPage = (root: HTMLElement): void => {
  root.innerHTML = `
    <h1 class="page-title">SteelSeries v3 Showcase</h1>
    <p class="page-subtitle">Every preview uses a consistent 220px gauge size. Each card highlights significant visual variations across radial, radial-bargraph, compass, and wind-direction gauges. Open a gauge page to tweak settings live with documented controls.</p>
    <div class="index-grid" id="index-grid"></div>
  `

  const grid = root.querySelector('#index-grid') as HTMLDivElement
  const cards: Array<{
    title: string
    link: Route
    create: () => HTMLElement
  }> = [
    {
      title: 'Radial Needle',
      link: '/radial',
      create: () => {
        const node = document.createElement('steelseries-radial-v3')
        applyGaugeProps(node, {
          title: 'Boiler',
          unit: 'bar',
          size: 220,
          value: 58,
          threshold: 72,
          showThreshold: true,
          pointerType: 'type2',
          pointerColor: 'ORANGE',
          gaugeType: 'type4',
          animateValue: false
        })
        return node
      }
    },
    {
      title: 'Radial Precision',
      link: '/radial',
      create: () => {
        const node = document.createElement('steelseries-radial-v3')
        applyGaugeProps(node, {
          title: 'Vacuum',
          unit: 'kPa',
          size: 220,
          value: 42,
          threshold: 50,
          showThreshold: true,
          frameDesign: 'brass',
          backgroundColor: 'BEIGE',
          foregroundType: 'type3',
          pointerType: 'type8',
          pointerColor: 'BLUE',
          minMeasuredValueVisible: true,
          minMeasuredValue: 18,
          maxMeasuredValueVisible: true,
          maxMeasuredValue: 67,
          animateValue: false
        })
        return node
      }
    },
    {
      title: 'Radial Reference',
      link: '/radial-bargraph',
      create: () => {
        const node = document.createElement('steelseries-radial-bargraph-v3')
        applyGaugeProps(node, {
          title: 'Pressure',
          unit: 'psi',
          size: 220,
          value: 74,
          threshold: 80,
          animateValue: false,
          gaugeType: 'type4'
        })
        return node
      }
    },
    {
      title: 'Radial Gradient + LCD',
      link: '/radial-bargraph',
      create: () => {
        const node = document.createElement('steelseries-radial-bargraph-v3')
        applyGaugeProps(node, {
          title: 'Temp',
          unit: '°C',
          size: 220,
          value: 66,
          threshold: 80,
          frameDesign: 'brass',
          backgroundColor: 'BEIGE',
          foregroundType: 'type3',
          gaugeType: 'type3',
          valueColor: 'GREEN',
          lcdColor: 'BLUE',
          useValueGradient: true,
          digitalFont: true,
          trendVisible: true,
          trendState: 'up',
          animateValue: false
        })
        return node
      }
    },
    {
      title: 'Compass Default',
      link: '/compass',
      create: () => {
        const node = document.createElement('steelseries-compass-v3')
        applyGaugeProps(node, {
          title: 'Heading',
          unit: 'deg',
          size: 220,
          heading: 92,
          animateValue: false
        })
        return node
      }
    },
    {
      title: 'Compass Marine',
      link: '/compass',
      create: () => {
        const node = document.createElement('steelseries-compass-v3')
        applyGaugeProps(node, {
          title: 'Marine',
          unit: 'deg',
          size: 220,
          heading: 184,
          frameDesign: 'brass',
          backgroundColor: 'BEIGE',
          pointerType: 'type1',
          pointerColor: 'BLUE',
          knobType: 'metalKnob',
          knobStyle: 'brass',
          foregroundType: 'type3',
          animateValue: false
        })
        return node
      }
    },
    {
      title: 'Wind Dual Pointer',
      link: '/wind-direction',
      create: () => {
        const node = document.createElement('steelseries-wind-direction-v3')
        applyGaugeProps(node, {
          title: 'Wind',
          unit: 'deg',
          size: 220,
          valueLatest: 45,
          valueAverage: 60,
          frameDesign: 'shinyMetal',
          backgroundColor: 'SATIN_GRAY',
          pointerTypeLatest: 'type1',
          pointerTypeAverage: 'type8',
          pointerColorLatest: 'RED',
          pointerColorAverage: 'BLUE',
          showDegreeScale: true,
          showPointSymbols: true,
          showRose: true,
          animateValue: false
        })
        return node
      }
    },
    {
      title: 'Wind Marine',
      link: '/wind-direction',
      create: () => {
        const node = document.createElement('steelseries-wind-direction-v3')
        applyGaugeProps(node, {
          title: 'Marine Wind',
          unit: '',
          size: 220,
          valueLatest: 275,
          valueAverage: 265,
          frameDesign: 'brass',
          backgroundColor: 'BEIGE',
          pointerColorLatest: 'GREEN',
          pointerColorAverage: 'ORANGE',
          knobType: 'metalKnob',
          knobStyle: 'brass',
          foregroundType: 'type3',
          lcdColor: 'STANDARD_GREEN',
          digitalFont: true,
          showDegreeScale: true,
          showRose: true,
          animateValue: false
        })
        return node
      }
    }
  ]

  cards.forEach((card) => {
    const article = document.createElement('article')
    article.className = 'demo-card'
    article.innerHTML = `
      <h3>${card.title}</h3>
      <div class="demo-stage"></div>
      <a class="card-link" href="${card.link}" data-nav="true">Open ${card.link.slice(1) || 'index'} controls</a>
    `
    const stage = article.querySelector('.demo-stage') as HTMLDivElement
    stage.append(card.create())
    grid.append(article)
  })
}

const renderControls = (
  container: HTMLElement,
  controls: ControlDef[],
  state: Record<string, unknown>,
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
  state: Record<string, unknown>
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
  defaults: Record<string, unknown>
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

const renderPlaygroundPage = (
  root: HTMLElement,
  title: string,
  subtitle: string,
  gaugeTag: string,
  controls: ControlDef[],
  defaults: Record<string, unknown>,
  normalizeState?: (state: Record<string, unknown>, controls: ControlDef[]) => void
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

  const state: Record<string, unknown> = { ...defaults }
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

const renderNeedleRadialPage = (root: HTMLElement): void => {
  const defaults: Record<string, unknown> = {
    value: 58,
    minValue: 0,
    maxValue: 100,
    threshold: 72,
    showThreshold: true,
    alertsEnabled: false,
    warningAlertValue: 72,
    criticalAlertValue: 88,
    title: 'Boiler',
    unit: 'bar',
    frameDesign: 'metal',
    backgroundColor: 'DARK_GRAY',
    foregroundType: 'type1',
    gaugeType: 'type4',
    orientation: 'north',
    pointerType: 'type2',
    pointerColor: 'RED',
    majorTickCount: 9,
    minorTicksPerMajor: 4,
    startAngle: (-3 * Math.PI) / 4,
    endAngle: (3 * Math.PI) / 4,
    showFrame: true,
    showBackground: true,
    showForeground: true,
    showLcd: true,
    animateValue: true,
    ledVisible: false,
    userLedVisible: false,
    trendVisible: false,
    trendState: 'down',
    minMeasuredValueVisible: false,
    maxMeasuredValueVisible: false,
    minMeasuredValue: 30,
    maxMeasuredValue: 76
  }

  const controls: ControlDef[] = [
    {
      key: 'minValue',
      label: 'Min Value',
      description: 'Lower bound for gauge range.',
      type: 'number',
      min: -999,
      max: 999,
      step: 1
    },
    {
      key: 'maxValue',
      label: 'Max Value',
      description: 'Upper bound for gauge range.',
      type: 'number',
      min: -999,
      max: 999,
      step: 1
    },
    {
      key: 'value',
      label: 'Value',
      description: 'Primary gauge value (constrained to Min/Max range).',
      type: 'range',
      min: 0,
      max: 100,
      step: 1
    },
    {
      key: 'showThreshold',
      label: 'Show Threshold',
      description: 'Toggle threshold marker visibility.',
      type: 'checkbox'
    },
    {
      key: 'threshold',
      label: 'Threshold',
      description: 'Threshold marker value.',
      type: 'range',
      min: 0,
      max: 100,
      step: 1
    },
    {
      key: 'alertsEnabled',
      label: 'Enable Alerts',
      description: 'Enable warning/critical alert-based tone changes.',
      type: 'checkbox'
    },
    {
      key: 'warningAlertValue',
      label: 'Warning Alert Value',
      description: 'Value where warning alert starts.',
      type: 'range',
      min: 0,
      max: 100,
      step: 1
    },
    {
      key: 'criticalAlertValue',
      label: 'Critical Alert Value',
      description: 'Value where critical alert starts.',
      type: 'range',
      min: 0,
      max: 100,
      step: 1
    },
    { key: 'title', label: 'Title', description: 'Displayed title text.', type: 'text' },
    { key: 'unit', label: 'Unit', description: 'Displayed unit text.', type: 'text' },
    {
      key: 'frameDesign',
      label: 'Frame Design',
      description: 'Outer bezel style.',
      type: 'select',
      options: frameOptions
    },
    {
      key: 'backgroundColor',
      label: 'Background',
      description: 'Dial background material/palette.',
      type: 'select',
      options: backgroundOptions
    },
    {
      key: 'foregroundType',
      label: 'Foreground',
      description: 'Glass overlay type.',
      type: 'select',
      options: foregroundTypeOptions
    },
    {
      key: 'gaugeType',
      label: 'Gauge Type',
      description: 'Arc geometry variant.',
      type: 'select',
      options: radialGaugeTypeOptions
    },
    {
      key: 'orientation',
      label: 'Type5 Orientation',
      description: 'Orientation for gauge type5 (ignored by type1-type4).',
      type: 'select',
      options: orientationOptions
    },
    {
      key: 'pointerType',
      label: 'Pointer Type',
      description: 'Needle geometry style.',
      type: 'select',
      options: pointerTypeOptions
    },
    {
      key: 'pointerColor',
      label: 'Pointer Color',
      description: 'Needle color family.',
      type: 'select',
      options: pointerColorOptions
    },
    {
      key: 'majorTickCount',
      label: 'Major Tick Count',
      description: 'Number of major ticks on the scale.',
      type: 'number',
      min: 2,
      max: 20,
      step: 1
    },
    {
      key: 'minorTicksPerMajor',
      label: 'Minor Ticks Per Major',
      description: 'Minor tick count between major ticks.',
      type: 'number',
      min: 0,
      max: 10,
      step: 1
    },
    {
      key: 'startAngle',
      label: 'Start Angle (rad)',
      description: 'Scale arc start angle in radians.',
      type: 'number',
      min: -6.3,
      max: 6.3,
      step: 0.1
    },
    {
      key: 'endAngle',
      label: 'End Angle (rad)',
      description: 'Scale arc end angle in radians.',
      type: 'number',
      min: -6.3,
      max: 6.3,
      step: 0.1
    },
    {
      key: 'showFrame',
      label: 'Show Frame',
      description: 'Toggle frame visibility.',
      type: 'checkbox'
    },
    {
      key: 'showBackground',
      label: 'Show Background',
      description: 'Toggle dial background visibility.',
      type: 'checkbox'
    },
    {
      key: 'showForeground',
      label: 'Show Foreground',
      description: 'Toggle glass foreground visibility.',
      type: 'checkbox'
    },
    { key: 'showLcd', label: 'Show LCD', description: 'Toggle LCD visibility.', type: 'checkbox' },
    {
      key: 'animateValue',
      label: 'Animate Value',
      description: 'Animate value transitions when reading changes.',
      type: 'checkbox'
    },
    {
      key: 'ledVisible',
      label: 'Show Alert LED',
      description: 'Toggle alert LED visibility.',
      type: 'checkbox'
    },
    {
      key: 'userLedVisible',
      label: 'Show User LED',
      description: 'Toggle secondary LED indicator.',
      type: 'checkbox'
    },
    {
      key: 'trendVisible',
      label: 'Show Trend',
      description: 'Toggle trend indicator.',
      type: 'checkbox'
    },
    {
      key: 'trendState',
      label: 'Trend State',
      description: 'Current trend arrow state.',
      type: 'select',
      options: ['up', 'steady', 'down'].map((value) => ({ value, label: value }))
    },
    {
      key: 'minMeasuredValueVisible',
      label: 'Show Min Marker',
      description: 'Toggle minimum measured marker.',
      type: 'checkbox'
    },
    {
      key: 'minMeasuredValue',
      label: 'Min Measured Value',
      description: 'Position for minimum measured marker.',
      type: 'range',
      min: 0,
      max: 100,
      step: 1
    },
    {
      key: 'maxMeasuredValueVisible',
      label: 'Show Max Marker',
      description: 'Toggle maximum measured marker.',
      type: 'checkbox'
    },
    {
      key: 'maxMeasuredValue',
      label: 'Max Measured Value',
      description: 'Position for maximum measured marker.',
      type: 'range',
      min: 0,
      max: 100,
      step: 1
    }
  ]

  renderPlaygroundPage(
    root,
    'Radial Gauge Playground',
    'Adjust radial-gauge settings live, including new type5 radial-vertical orientation options, pointer style, threshold, and measured min/max markers.',
    'steelseries-radial-v3',
    controls,
    defaults,
    (state, controlDefs) => {
      const rawMin = asFiniteNumber(state.minValue, 0)
      const rawMax = asFiniteNumber(state.maxValue, 100)
      const minValue = Math.min(rawMin, rawMax)
      const maxValue = Math.max(rawMin, rawMax)

      state.minValue = minValue
      state.maxValue = maxValue
      state.value = clampNumber(asFiniteNumber(state.value, minValue), minValue, maxValue)
      state.threshold = clampNumber(asFiniteNumber(state.threshold, minValue), minValue, maxValue)
      state.warningAlertValue = clampNumber(
        asFiniteNumber(state.warningAlertValue, minValue),
        minValue,
        maxValue
      )
      state.criticalAlertValue = clampNumber(
        asFiniteNumber(state.criticalAlertValue, maxValue),
        minValue,
        maxValue
      )
      state.minMeasuredValue = clampNumber(
        asFiniteNumber(state.minMeasuredValue, minValue),
        minValue,
        maxValue
      )
      state.maxMeasuredValue = clampNumber(
        asFiniteNumber(state.maxMeasuredValue, maxValue),
        minValue,
        maxValue
      )

      const warningAlertValue = asFiniteNumber(state.warningAlertValue, minValue)
      const criticalAlertValue = asFiniteNumber(state.criticalAlertValue, maxValue)
      state.warningAlertValue = Math.min(warningAlertValue, criticalAlertValue)
      state.criticalAlertValue = Math.max(warningAlertValue, criticalAlertValue)

      const startAngle = asFiniteNumber(state.startAngle, (-3 * Math.PI) / 4)
      const endAngle = asFiniteNumber(state.endAngle, (3 * Math.PI) / 4)
      if (Math.abs(endAngle - startAngle) < 0.001) {
        state.endAngle = startAngle + 0.1
      }

      state.majorTickCount = Math.round(clampNumber(asFiniteNumber(state.majorTickCount, 9), 2, 20))
      state.minorTicksPerMajor = Math.round(
        clampNumber(asFiniteNumber(state.minorTicksPerMajor, 4), 0, 10)
      )

      for (const key of [
        'value',
        'threshold',
        'warningAlertValue',
        'criticalAlertValue',
        'minMeasuredValue',
        'maxMeasuredValue'
      ]) {
        const control = controlDefs.find((entry) => entry.key === key)
        if (!control) {
          continue
        }
        control.min = minValue
        control.max = maxValue
      }
    }
  )
}

const renderRadialPage = (root: HTMLElement): void => {
  const defaults: Record<string, unknown> = {
    value: 72,
    minValue: 0,
    maxValue: 100,
    threshold: 80,
    alertsEnabled: false,
    warningAlertValue: 80,
    criticalAlertValue: 95,
    title: 'Pressure',
    unit: 'psi',
    frameDesign: 'metal',
    backgroundColor: 'DARK_GRAY',
    foregroundType: 'type1',
    gaugeType: 'type4',
    valueColor: 'RED',
    lcdColor: 'STANDARD',
    lcdDecimals: 2,
    labelNumberFormat: 'standard',
    tickLabelOrientation: 'normal',
    fractionalScaleDecimals: 1,
    digitalFont: false,
    showFrame: true,
    showBackground: true,
    showForeground: true,
    showLcd: true,
    animateValue: true,
    ledVisible: false,
    userLedVisible: false,
    trendVisible: false,
    trendState: 'off',
    useSectionColors: false,
    useValueGradient: false
  }

  const controls: ControlDef[] = [
    {
      key: 'minValue',
      label: 'Min Value',
      description: 'Lower bound for gauge range.',
      type: 'number',
      min: -999,
      max: 999,
      step: 1
    },
    {
      key: 'maxValue',
      label: 'Max Value',
      description: 'Upper bound for gauge range.',
      type: 'number',
      min: -999,
      max: 999,
      step: 1
    },
    {
      key: 'value',
      label: 'Value',
      description: 'Primary gauge value (constrained to Min/Max range).',
      type: 'range',
      min: 0,
      max: 100,
      step: 1
    },
    {
      key: 'threshold',
      label: 'Threshold',
      description: 'Warning threshold marker (constrained to Min/Max range).',
      type: 'range',
      min: 0,
      max: 100,
      step: 1
    },
    {
      key: 'alertsEnabled',
      label: 'Enable Alerts',
      description: 'Enable warning/critical alert-based tone changes.',
      type: 'checkbox'
    },
    {
      key: 'warningAlertValue',
      label: 'Warning Alert Value',
      description: 'Value where warning alert starts.',
      type: 'range',
      min: 0,
      max: 100,
      step: 1
    },
    {
      key: 'criticalAlertValue',
      label: 'Critical Alert Value',
      description: 'Value where critical alert starts.',
      type: 'range',
      min: 0,
      max: 100,
      step: 1
    },
    { key: 'title', label: 'Title', description: 'Displayed title text.', type: 'text' },
    { key: 'unit', label: 'Unit', description: 'Displayed unit text.', type: 'text' },
    {
      key: 'frameDesign',
      label: 'Frame Design',
      description: 'Outer bezel style.',
      type: 'select',
      options: frameOptions
    },
    {
      key: 'backgroundColor',
      label: 'Background',
      description: 'Dial background material/palette.',
      type: 'select',
      options: backgroundOptions
    },
    {
      key: 'foregroundType',
      label: 'Foreground',
      description: 'Glass overlay type.',
      type: 'select',
      options: foregroundTypeOptions
    },
    {
      key: 'gaugeType',
      label: 'Gauge Type',
      description: 'Arc geometry variant.',
      type: 'select',
      options: gaugeTypeOptions
    },
    {
      key: 'valueColor',
      label: 'Value Color',
      description: 'LED/pointer color family.',
      type: 'select',
      options: pointerColorOptions
    },
    {
      key: 'lcdColor',
      label: 'LCD Color',
      description: 'LCD panel palette.',
      type: 'select',
      options: lcdColorOptions
    },
    {
      key: 'lcdDecimals',
      label: 'LCD Decimals',
      description: 'Decimals shown in LCD readout.',
      type: 'number',
      min: 0,
      max: 6,
      step: 1
    },
    {
      key: 'labelNumberFormat',
      label: 'Label Format',
      description: 'Tick label number format.',
      type: 'select',
      options: ['standard', 'fractional', 'scientific'].map((value) => ({ value, label: value }))
    },
    {
      key: 'tickLabelOrientation',
      label: 'Tick Label Orientation',
      description: 'How labels orient around arc.',
      type: 'select',
      options: ['normal', 'horizontal', 'tangent'].map((value) => ({ value, label: value }))
    },
    {
      key: 'fractionalScaleDecimals',
      label: 'Fractional Decimals',
      description: 'Decimals used when label format is fractional.',
      type: 'number',
      min: 0,
      max: 4,
      step: 1
    },
    {
      key: 'digitalFont',
      label: 'Digital Font',
      description: 'Use digital LCD font.',
      type: 'checkbox'
    },
    {
      key: 'showFrame',
      label: 'Show Frame',
      description: 'Toggle frame visibility.',
      type: 'checkbox'
    },
    {
      key: 'showBackground',
      label: 'Show Background',
      description: 'Toggle dial background visibility.',
      type: 'checkbox'
    },
    {
      key: 'showForeground',
      label: 'Show Foreground',
      description: 'Toggle glass foreground visibility.',
      type: 'checkbox'
    },
    { key: 'showLcd', label: 'Show LCD', description: 'Toggle LCD visibility.', type: 'checkbox' },
    {
      key: 'animateValue',
      label: 'Animate Value',
      description: 'Animate value transitions when reading changes.',
      type: 'checkbox'
    },
    {
      key: 'ledVisible',
      label: 'Show Alert LED',
      description: 'Toggle threshold LED.',
      type: 'checkbox'
    },
    {
      key: 'userLedVisible',
      label: 'Show User LED',
      description: 'Toggle secondary LED indicator.',
      type: 'checkbox'
    },
    {
      key: 'trendVisible',
      label: 'Show Trend',
      description: 'Toggle trend indicator.',
      type: 'checkbox'
    },
    {
      key: 'trendState',
      label: 'Trend State',
      description: 'Current trend arrow state.',
      type: 'select',
      options: ['off', 'up', 'steady', 'down'].map((value) => ({ value, label: value }))
    },
    {
      key: 'useSectionColors',
      label: 'Use Section Colors',
      description: 'Colorize active segments based on threshold (overrides gradient).',
      type: 'checkbox'
    },
    {
      key: 'useValueGradient',
      label: 'Use Value Gradient',
      description: 'Blend bar colors from low to high range (disabled when section colors are on).',
      type: 'checkbox'
    }
  ]

  renderPlaygroundPage(
    root,
    'Radial Bargraph Playground',
    'Adjust radial-bargraph settings live on a single larger gauge. Each control includes behavior notes and defaults.',
    'steelseries-radial-bargraph-v3',
    controls,
    defaults,
    (state, controlDefs) => {
      const rawMin = asFiniteNumber(state.minValue, 0)
      const rawMax = asFiniteNumber(state.maxValue, 100)
      const minValue = Math.min(rawMin, rawMax)
      const maxValue = Math.max(rawMin, rawMax)

      state.minValue = minValue
      state.maxValue = maxValue
      state.value = clampNumber(asFiniteNumber(state.value, minValue), minValue, maxValue)
      state.threshold = clampNumber(asFiniteNumber(state.threshold, minValue), minValue, maxValue)
      state.warningAlertValue = clampNumber(
        asFiniteNumber(state.warningAlertValue, minValue),
        minValue,
        maxValue
      )
      state.criticalAlertValue = clampNumber(
        asFiniteNumber(state.criticalAlertValue, maxValue),
        minValue,
        maxValue
      )

      const warningAlertValue = asFiniteNumber(state.warningAlertValue, minValue)
      const criticalAlertValue = asFiniteNumber(state.criticalAlertValue, maxValue)
      state.warningAlertValue = Math.min(warningAlertValue, criticalAlertValue)
      state.criticalAlertValue = Math.max(warningAlertValue, criticalAlertValue)

      if (Boolean(state.useSectionColors) && Boolean(state.useValueGradient)) {
        state.useValueGradient = false
      }

      for (const key of ['value', 'threshold', 'warningAlertValue', 'criticalAlertValue']) {
        const control = controlDefs.find((entry) => entry.key === key)
        if (!control) {
          continue
        }
        control.min = minValue
        control.max = maxValue
      }
    }
  )
}

const renderCompassPage = (root: HTMLElement): void => {
  const defaults: Record<string, unknown> = {
    heading: 125,
    title: 'Heading',
    unit: 'deg',
    frameDesign: 'metal',
    backgroundColor: 'DARK_GRAY',
    pointerType: 'type2',
    pointerColor: 'RED',
    knobType: 'standardKnob',
    knobStyle: 'silver',
    foregroundType: 'type1',
    degreeScale: false,
    degreeScaleHalf: false,
    roseVisible: true,
    rotateFace: false,
    animateValue: true,
    pointSymbolsVisible: true,
    showHeadingReadout: true,
    alertsEnabled: false,
    warningAlertHeading: 90,
    criticalAlertHeading: 180,
    pointSymbolN: 'N',
    pointSymbolNE: 'NE',
    pointSymbolE: 'E',
    pointSymbolSE: 'SE',
    pointSymbolS: 'S',
    pointSymbolSW: 'SW',
    pointSymbolW: 'W',
    pointSymbolNW: 'NW'
  }

  const controls: ControlDef[] = [
    {
      key: 'heading',
      label: 'Heading',
      description: 'Current compass heading in degrees.',
      type: 'range',
      min: 0,
      max: 359,
      step: 1
    },
    {
      key: 'alertsEnabled',
      label: 'Enable Alerts',
      description: 'Enable warning/critical heading alerts that adjust pointer tone.',
      type: 'checkbox'
    },
    {
      key: 'warningAlertHeading',
      label: 'Warning Alert Heading',
      description: 'Heading where warning alert activates.',
      type: 'range',
      min: 0,
      max: 359,
      step: 1
    },
    {
      key: 'criticalAlertHeading',
      label: 'Critical Alert Heading',
      description: 'Heading where critical alert activates.',
      type: 'range',
      min: 0,
      max: 359,
      step: 1
    },
    { key: 'title', label: 'Title', description: 'Displayed heading label.', type: 'text' },
    { key: 'unit', label: 'Unit', description: 'Displayed heading unit.', type: 'text' },
    {
      key: 'frameDesign',
      label: 'Frame Design',
      description: 'Outer bezel style.',
      type: 'select',
      options: frameOptions
    },
    {
      key: 'backgroundColor',
      label: 'Background',
      description: 'Dial background material/palette.',
      type: 'select',
      options: backgroundOptions
    },
    {
      key: 'pointerType',
      label: 'Pointer Type',
      description: 'Needle geometry style.',
      type: 'select',
      options: pointerTypeOptions
    },
    {
      key: 'pointerColor',
      label: 'Pointer Color',
      description: 'Needle color family.',
      type: 'select',
      options: pointerColorOptions
    },
    {
      key: 'knobType',
      label: 'Knob Type',
      description: 'Hub type used at center.',
      type: 'select',
      options: knobTypeOptions
    },
    {
      key: 'knobStyle',
      label: 'Knob Style',
      description: 'Hub surface finish.',
      type: 'select',
      options: knobStyleOptions
    },
    {
      key: 'foregroundType',
      label: 'Foreground',
      description: 'Glass overlay type.',
      type: 'select',
      options: foregroundTypeOptions
    },
    {
      key: 'degreeScale',
      label: 'Show Degree Scale',
      description: 'Switch to degree labels instead of cardinal-only emphasis.',
      type: 'checkbox'
    },
    {
      key: 'degreeScaleHalf',
      label: 'Half Heading Scale',
      description: 'Show degree labels as -180 to 180 instead of 0 to 360.',
      type: 'checkbox'
    },
    {
      key: 'pointSymbolsVisible',
      label: 'Show Point Symbols',
      description: 'Show N/NE/E... labels.',
      type: 'checkbox'
    },
    {
      key: 'roseVisible',
      label: 'Show Rose',
      description: 'Toggle rose rays and inner ring.',
      type: 'checkbox'
    },
    {
      key: 'rotateFace',
      label: 'Rotate Face',
      description: 'Rotate face opposite heading instead of pointer-only movement.',
      type: 'checkbox'
    },
    {
      key: 'showHeadingReadout',
      label: 'Show Heading Readout',
      description: 'Show text readout under center.',
      type: 'checkbox'
    },
    {
      key: 'animateValue',
      label: 'Animate Value',
      description: 'Animate heading transitions when heading changes.',
      type: 'checkbox'
    },
    {
      key: 'pointSymbolN',
      label: 'North Symbol',
      description: 'Text used for north point marker.',
      type: 'text'
    },
    {
      key: 'pointSymbolNE',
      label: 'North-East Symbol',
      description: 'Text used for north-east marker.',
      type: 'text'
    },
    {
      key: 'pointSymbolE',
      label: 'East Symbol',
      description: 'Text used for east marker.',
      type: 'text'
    },
    {
      key: 'pointSymbolSE',
      label: 'South-East Symbol',
      description: 'Text used for south-east marker.',
      type: 'text'
    },
    {
      key: 'pointSymbolS',
      label: 'South Symbol',
      description: 'Text used for south marker.',
      type: 'text'
    },
    {
      key: 'pointSymbolSW',
      label: 'South-West Symbol',
      description: 'Text used for south-west marker.',
      type: 'text'
    },
    {
      key: 'pointSymbolW',
      label: 'West Symbol',
      description: 'Text used for west marker.',
      type: 'text'
    },
    {
      key: 'pointSymbolNW',
      label: 'North-West Symbol',
      description: 'Text used for north-west marker.',
      type: 'text'
    }
  ]

  renderPlaygroundPage(
    root,
    'Compass Playground',
    'Live tune compass styling and behavior. Use pointer, rose, and foreground controls to compare variants.',
    'steelseries-compass-v3',
    controls,
    defaults,
    (state) => {
      state.heading = clampNumber(asFiniteNumber(state.heading, 0), 0, 359)
      state.warningAlertHeading = clampNumber(asFiniteNumber(state.warningAlertHeading, 90), 0, 359)
      state.criticalAlertHeading = clampNumber(
        asFiniteNumber(state.criticalAlertHeading, 180),
        0,
        359
      )
    }
  )
}

const renderWindPage = (root: HTMLElement): void => {
  const defaults: Record<string, unknown> = {
    valueLatest: 48,
    valueAverage: 63,
    alertsEnabled: false,
    warningAlertHeading: 90,
    criticalAlertHeading: 180,
    title: 'Wind',
    unit: 'deg',
    frameDesign: 'metal',
    backgroundColor: 'DARK_GRAY',
    pointerTypeLatest: 'type1',
    pointerTypeAverage: 'type8',
    pointerColorLatest: 'RED',
    pointerColorAverage: 'BLUE',
    knobType: 'standardKnob',
    knobStyle: 'silver',
    foregroundType: 'type1',
    lcdColor: 'STANDARD',
    lcdTitleLatest: 'Latest',
    lcdTitleAverage: 'Average',
    showFrame: true,
    showBackground: true,
    showForeground: true,
    showLcd: true,
    animateValue: true,
    showPointSymbols: true,
    showDegreeScale: true,
    showRose: true,
    degreeScaleHalf: false,
    digitalFont: false,
    useColorLabels: false
  }

  const controls: ControlDef[] = [
    {
      key: 'valueLatest',
      label: 'Latest Value',
      description: 'Latest wind direction value.',
      type: 'range',
      min: 0,
      max: 359,
      step: 1
    },
    {
      key: 'valueAverage',
      label: 'Average Value',
      description: 'Average wind direction value.',
      type: 'range',
      min: 0,
      max: 359,
      step: 1
    },
    {
      key: 'alertsEnabled',
      label: 'Enable Alerts',
      description: 'Enable warning/critical heading alerts for wind pointers.',
      type: 'checkbox'
    },
    {
      key: 'warningAlertHeading',
      label: 'Warning Alert Heading',
      description: 'Heading where warning alert activates.',
      type: 'range',
      min: 0,
      max: 359,
      step: 1
    },
    {
      key: 'criticalAlertHeading',
      label: 'Critical Alert Heading',
      description: 'Heading where critical alert activates.',
      type: 'range',
      min: 0,
      max: 359,
      step: 1
    },
    { key: 'title', label: 'Title', description: 'Gauge title text.', type: 'text' },
    { key: 'unit', label: 'Unit', description: 'Unit text.', type: 'text' },
    {
      key: 'frameDesign',
      label: 'Frame Design',
      description: 'Outer bezel style.',
      type: 'select',
      options: frameOptions
    },
    {
      key: 'backgroundColor',
      label: 'Background',
      description: 'Dial background material/palette.',
      type: 'select',
      options: backgroundOptions
    },
    {
      key: 'pointerTypeLatest',
      label: 'Latest Pointer Type',
      description: 'Pointer style for latest value.',
      type: 'select',
      options: pointerTypeOptions
    },
    {
      key: 'pointerTypeAverage',
      label: 'Average Pointer Type',
      description: 'Pointer style for average value.',
      type: 'select',
      options: pointerTypeOptions
    },
    {
      key: 'pointerColorLatest',
      label: 'Latest Pointer Color',
      description: 'Pointer color family for latest.',
      type: 'select',
      options: pointerColorOptions
    },
    {
      key: 'pointerColorAverage',
      label: 'Average Pointer Color',
      description: 'Pointer color family for average.',
      type: 'select',
      options: pointerColorOptions
    },
    {
      key: 'knobType',
      label: 'Knob Type',
      description: 'Hub type used at center.',
      type: 'select',
      options: knobTypeOptions
    },
    {
      key: 'knobStyle',
      label: 'Knob Style',
      description: 'Hub finish style.',
      type: 'select',
      options: knobStyleOptions
    },
    {
      key: 'foregroundType',
      label: 'Foreground',
      description: 'Glass overlay type.',
      type: 'select',
      options: foregroundTypeOptions
    },
    {
      key: 'lcdColor',
      label: 'LCD Color',
      description: 'LCD panel palette.',
      type: 'select',
      options: lcdColorOptions
    },
    {
      key: 'lcdTitleLatest',
      label: 'Latest LCD Title',
      description: 'Title above latest LCD row.',
      type: 'text'
    },
    {
      key: 'lcdTitleAverage',
      label: 'Average LCD Title',
      description: 'Title above average LCD row.',
      type: 'text'
    },
    {
      key: 'showFrame',
      label: 'Show Frame',
      description: 'Toggle frame visibility.',
      type: 'checkbox'
    },
    {
      key: 'showBackground',
      label: 'Show Background',
      description: 'Toggle dial background visibility.',
      type: 'checkbox'
    },
    {
      key: 'showForeground',
      label: 'Show Foreground',
      description: 'Toggle glass foreground visibility.',
      type: 'checkbox'
    },
    { key: 'showLcd', label: 'Show LCD', description: 'Toggle LCD visibility.', type: 'checkbox' },
    {
      key: 'animateValue',
      label: 'Animate Value',
      description: 'Animate latest/average pointer transitions when values change.',
      type: 'checkbox'
    },
    {
      key: 'showPointSymbols',
      label: 'Show Point Symbols',
      description: 'Show N/NE/E labels.',
      type: 'checkbox'
    },
    {
      key: 'showDegreeScale',
      label: 'Show Degree Scale',
      description: 'Show degree scale labels.',
      type: 'checkbox'
    },
    {
      key: 'showRose',
      label: 'Show Rose',
      description: 'Show compass rose overlay.',
      type: 'checkbox'
    },
    {
      key: 'degreeScaleHalf',
      label: 'Half Heading Scale',
      description: 'Show degree labels and LCD values as -180 to 180 instead of 0 to 360.',
      type: 'checkbox'
    },
    {
      key: 'digitalFont',
      label: 'Digital Font',
      description: 'Use digital LCD font style.',
      type: 'checkbox'
    },
    {
      key: 'useColorLabels',
      label: 'Color LCD Labels',
      description: 'Color latest/average labels to match pointer colors.',
      type: 'checkbox'
    }
  ]

  renderPlaygroundPage(
    root,
    'Wind Direction Playground',
    'Tune the dual-pointer wind-direction gauge live, including rose, LCD, pointer styles, and visibility options.',
    'steelseries-wind-direction-v3',
    controls,
    defaults,
    (state) => {
      state.valueLatest = clampNumber(asFiniteNumber(state.valueLatest, 0), 0, 359)
      state.valueAverage = clampNumber(asFiniteNumber(state.valueAverage, 0), 0, 359)
      state.warningAlertHeading = clampNumber(asFiniteNumber(state.warningAlertHeading, 90), 0, 359)
      state.criticalAlertHeading = clampNumber(
        asFiniteNumber(state.criticalAlertHeading, 180),
        0,
        359
      )
    }
  )
}

const renderPage = (): void => {
  if (!app) {
    return
  }

  const route = currentRoute()
  app.innerHTML = renderShell(route)
  const root = app.querySelector('#page-root') as HTMLDivElement

  if (route === '/radial') {
    renderNeedleRadialPage(root)
  } else if (route === '/radial-bargraph') {
    renderRadialPage(root)
  } else if (route === '/compass') {
    renderCompassPage(root)
  } else if (route === '/wind-direction') {
    renderWindPage(root)
  } else {
    renderIndexPage(root)
  }

  app.querySelectorAll('a[data-nav="true"]').forEach((link) => {
    link.addEventListener('click', (event) => {
      const anchor = event.currentTarget as HTMLAnchorElement
      const target = anchor.getAttribute('href')
      if (!target) {
        return
      }
      event.preventDefault()
      if (window.location.pathname !== target) {
        window.history.pushState({}, '', target)
      }
      renderPage()
    })
  })
}

window.addEventListener('popstate', renderPage)
renderPage()
