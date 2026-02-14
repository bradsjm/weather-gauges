import type { PlaygroundState } from './types'

const asString = (value: unknown, fallback: string): string => {
  return typeof value === 'string' ? value : fallback
}

const asNumber = (value: unknown, fallback: number): number => {
  return typeof value === 'number' && Number.isFinite(value) ? value : fallback
}

const asBoolean = (value: unknown, fallback: boolean): boolean => {
  return typeof value === 'boolean' ? value : fallback
}

const escapeAttr = (value: string): string =>
  value.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;')

export const buildMinimalHtmlSnippet = (gaugeTag: string, state: PlaygroundState): string => {
  const label = asString(state.label ?? state.title, '')
  const unit = asString(state.unit, '')
  const size = asNumber(state.size, 300)

  // Stable attribute surface from root README (works across most gauges).
  const value = asNumber(state.value ?? state.heading ?? state.valueLatest, 0)
  const animated = asBoolean(state.animated ?? state.animateValue, true)
  const preset = asString(state.preset, '')

  const minValue = asNumber(state.gaugeMin ?? state.minValue, 0)
  const maxValue = asNumber(state.gaugeMax ?? state.maxValue, 100)
  const threshold = asNumber(state.threshold, NaN)

  const attrs: string[] = []
  attrs.push(`size="${size}"`)
  attrs.push(`value="${value}"`)
  if (label) {
    attrs.push(`label="${escapeAttr(label)}"`)
  }
  if (unit) {
    attrs.push(`unit="${escapeAttr(unit)}"`)
  }
  if (preset) {
    attrs.push(`preset="${escapeAttr(preset)}"`)
  }

  // Only scalar gauges use gauge-min/max/threshold; harmless to include on others but keep it tidy.
  if (gaugeTag === 'wx-gauge' || gaugeTag === 'wx-bargraph') {
    attrs.push(`gauge-min="${minValue}"`)
    attrs.push(`gauge-max="${maxValue}"`)
    if (Number.isFinite(threshold)) {
      attrs.push(`threshold="${threshold}"`)
    }
  }

  if (!animated) {
    attrs.push('animated="false"')
  }

  return `<${gaugeTag} ${attrs.join(' ')}></${gaugeTag}>`
}

export const buildFullJsSnippet = (gaugeTag: string, state: PlaygroundState): string => {
  const stateJson = JSON.stringify(state, null, 2)
  return `import '@bradsjm/weather-gauges-elements'\n\nconst el = document.createElement('${gaugeTag}')\nObject.assign(el, ${stateJson})\ndocument.body.append(el)\n`
}
