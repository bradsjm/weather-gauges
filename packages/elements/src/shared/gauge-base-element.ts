import {
  gaugeContract,
  resolveThemePaint,
  createStyleTokenSource,
  type AnimationRunHandle,
  type ThemePaint
} from '@bradsjm/steelseries-v3-core'
import { LitElement } from 'lit'

export abstract class SteelseriesGaugeElement extends LitElement {
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

  protected emitGaugeError(kind: string, error: unknown, fallbackMessage: string): void {
    this.dispatchEvent(
      new CustomEvent(gaugeContract.errorEvent, {
        detail: {
          kind,
          message: error instanceof Error ? error.message : fallbackMessage
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
