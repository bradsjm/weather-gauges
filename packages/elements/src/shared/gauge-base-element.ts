import {
  gaugeContract,
  resolveThemePaint,
  createStyleTokenSource,
  type GaugeContractKind,
  type AnimationRunHandle,
  type ThemePaint
} from '@bradsjm/weather-gauges-core'
import { LitElement } from 'lit'
import { property } from 'lit/decorators.js'

type GaugeValidationMode = 'clamp' | 'coerce' | 'strict'

type GaugeErrorIssue = {
  path: string
  message: string
}

type ErrorWithIssues = {
  issues: Array<{
    path?: PropertyKey[]
    message?: string
  }>
}

const formatIssuePath = (path: PropertyKey[] | undefined): string => {
  if (!path || path.length === 0) {
    return 'root'
  }

  return path
    .map((segment) => {
      if (typeof segment === 'number') {
        return `[${segment}]`
      }

      return String(segment)
    })
    .join('.')
}

const hasIssues = (value: unknown): value is ErrorWithIssues => {
  if (!value || typeof value !== 'object' || !('issues' in value)) {
    return false
  }

  const { issues } = value as ErrorWithIssues
  return Array.isArray(issues)
}

export abstract class WeatherGaugeElement extends LitElement {
  @property({ type: String })
  validation: GaugeValidationMode = 'clamp'

  @property({ attribute: false })
  readingText = ''

  protected animationHandle: AnimationRunHandle | undefined

  protected getThemePaint(): ThemePaint {
    const computedStyle = getComputedStyle(this)
    return resolveThemePaint({
      source: createStyleTokenSource(computedStyle)
    })
  }

  protected getCanvasContext<T extends CanvasRenderingContext2D>(
    canvasElement: HTMLCanvasElement | undefined
  ): T | undefined {
    if (!canvasElement) {
      return undefined
    }

    const drawContext = canvasElement.getContext('2d')
    if (!drawContext) {
      return undefined
    }

    return drawContext as T
  }

  protected emitGaugeValueChange(detail: unknown): void {
    this.dispatchEvent(
      new CustomEvent(gaugeContract.valueChangeEvent, {
        detail,
        bubbles: true,
        composed: true
      })
    )
  }

  protected normalizeNumber(value: number, fallback: number): number {
    if (Number.isFinite(value)) {
      return value
    }

    if (this.validation === 'coerce') {
      const coerced = Number(value)
      if (Number.isFinite(coerced)) {
        return coerced
      }
    }

    return fallback
  }

  protected normalizeInRange(value: number, min: number, max: number, fallback: number): number {
    const finiteValue = this.normalizeNumber(value, fallback)

    if (this.validation === 'strict') {
      return finiteValue
    }

    return Math.min(max, Math.max(min, finiteValue))
  }

  protected normalizeNonNegative(value: number, fallback: number): number {
    const finiteValue = this.normalizeNumber(value, fallback)

    if (this.validation === 'strict') {
      return finiteValue
    }

    return Math.max(0, finiteValue)
  }

  protected normalizedRange(minValue: number, maxValue: number): { min: number; max: number } {
    const min = this.normalizeNumber(minValue, 0)
    const max = this.normalizeNumber(maxValue, 100)

    if (this.validation === 'strict' || min <= max) {
      return { min, max }
    }

    return { min: max, max: min }
  }

  protected getChildElements(...tagNames: string[]): Element[] {
    const tags = new Set(tagNames.map((tagName) => tagName.toLowerCase()))
    return Array.from(this.children).filter((child) => tags.has(child.tagName.toLowerCase()))
  }

  protected readNumericAttribute(element: Element, names: string[]): number | undefined {
    for (const name of names) {
      const raw = element.getAttribute(name)
      if (raw === null) {
        continue
      }

      const parsed = Number(raw)
      if (Number.isFinite(parsed)) {
        return parsed
      }

      if (this.validation === 'coerce') {
        const trimmed = raw.trim()
        const coerced = Number(trimmed)
        if (Number.isFinite(coerced)) {
          return coerced
        }
      }
    }

    return undefined
  }

  protected readStringAttribute(element: Element, names: string[]): string | undefined {
    for (const name of names) {
      const raw = element.getAttribute(name)
      if (raw === null) {
        continue
      }

      const trimmed = raw.trim()
      if (trimmed.length > 0) {
        return trimmed
      }
    }

    return undefined
  }

  protected resolveReadingText(fallbackText: string): string {
    const slot = this.renderRoot.querySelector('slot[name="sr-content"]')
    let customText = ''

    if (slot instanceof HTMLSlotElement) {
      customText = slot
        .assignedNodes({ flatten: true })
        .map((node) => node.textContent ?? '')
        .join(' ')
        .trim()
    }

    const readingText = customText.length > 0 ? customText : fallbackText
    this.readingText = readingText
    return readingText
  }

  protected setCanvasAccessibility(
    canvasElement: HTMLCanvasElement,
    options: {
      label: string
      valueNow?: number
      valueMin?: number
      valueMax?: number
    }
  ): void {
    const label = this.resolveReadingText(options.label)
    canvasElement.setAttribute('aria-label', label)

    const setOrRemove = (name: string, value: number | undefined): void => {
      if (typeof value === 'number' && Number.isFinite(value)) {
        canvasElement.setAttribute(name, String(value))
      } else {
        canvasElement.removeAttribute(name)
      }
    }

    setOrRemove('aria-valuenow', options.valueNow)
    setOrRemove('aria-valuemin', options.valueMin)
    setOrRemove('aria-valuemax', options.valueMax)
  }

  private extractIssues(error: unknown): GaugeErrorIssue[] | undefined {
    if (!hasIssues(error)) {
      return undefined
    }

    const issues = error.issues
      .map((issue) => {
        if (!issue || typeof issue.message !== 'string') {
          return undefined
        }

        return {
          path: formatIssuePath(issue.path),
          message: issue.message
        }
      })
      .filter((issue): issue is GaugeErrorIssue => issue !== undefined)

    return issues.length > 0 ? issues : undefined
  }

  protected emitGaugeError(kind: GaugeContractKind, error: unknown, fallbackMessage: string): void {
    const issues = this.extractIssues(error)
    const code = issues ? 'invalid_config' : 'render_error'

    this.dispatchEvent(
      new CustomEvent(gaugeContract.errorEvent, {
        detail: {
          kind,
          code,
          message: error instanceof Error ? error.message : fallbackMessage,
          ...(issues ? { issues } : {})
        },
        bubbles: true,
        composed: true
      })
    )
  }

  override disconnectedCallback(): void {
    this.animationHandle?.cancel()
    this.animationHandle = undefined
    super.disconnectedCallback()
  }
}
