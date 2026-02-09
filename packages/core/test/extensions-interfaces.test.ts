import { describe, expect, it, vi } from 'vitest'

import type {
  MarkerExtension,
  NeedleVariantExtension,
  OverlayExtension,
  RadialBargraphGaugeConfig,
  RenderSurface
} from '../src/index.js'
import { createExtensionRegistry } from '../src/index.js'

const createMockSurface = (): RenderSurface => {
  return {
    canvas: {
      width: 200,
      height: 200,
      getContext: () => ({
        clearRect: () => undefined
      })
    },
    context: {
      clearRect: () => undefined
    },
    clear: () => undefined
  }
}

describe('extension interfaces and registry', () => {
  it('registers and filters overlay/marker/needle extensions', () => {
    const registry = createExtensionRegistry<RadialBargraphGaugeConfig>()

    const overlayRender = vi.fn()
    const markerRender = vi.fn()
    const needleRender = vi.fn()

    const overlay: OverlayExtension<RadialBargraphGaugeConfig> = {
      id: 'overlay-grid',
      point: 'overlay',
      render: overlayRender
    }

    const marker: MarkerExtension<RadialBargraphGaugeConfig> = {
      id: 'marker-threshold',
      point: 'marker',
      markerValue: 75,
      render: markerRender
    }

    const needle: NeedleVariantExtension<RadialBargraphGaugeConfig> = {
      id: 'needle-slim',
      point: 'needle',
      render: needleRender
    }

    registry.register(overlay)
    registry.register(marker)
    registry.register(needle)

    expect(registry.list()).toHaveLength(3)
    expect(registry.list('overlay')).toEqual([overlay])
    expect(registry.list('marker')).toEqual([marker])
    expect(registry.list('needle')).toEqual([needle])
    expect(registry.getById('marker-threshold')).toBe(marker)
  })

  it('supports rendering through typed extension context', () => {
    const registry = createExtensionRegistry<RadialBargraphGaugeConfig>()
    const overlayRender = vi.fn()

    const overlay: OverlayExtension<RadialBargraphGaugeConfig> = {
      id: 'overlay-arcs',
      point: 'overlay',
      render: overlayRender
    }

    registry.register(overlay)

    const extension = registry.getById('overlay-arcs')
    if (!extension) {
      throw new Error('expected extension to be registered')
    }

    extension.render({
      gaugeKind: 'radial-bargraph',
      config: {
        value: { min: 0, max: 100, current: 42 },
        size: { width: 200, height: 200 },
        animation: { enabled: true, durationMs: 500, easing: 'easeInOutCubic' },
        visibility: { showFrame: true, showBackground: true, showForeground: true, showLcd: true },
        text: { title: 'Pressure', unit: 'psi' },
        scale: {
          startAngle: -0.75 * Math.PI,
          endAngle: 0.75 * Math.PI,
          majorTickCount: 9,
          minorTicksPerMajor: 4
        },
        style: {
          frameDesign: 'metal',
          backgroundColor: 'DARK_GRAY',
          foregroundType: 'type1',
          labelNumberFormat: 'standard',
          lcdColor: 'STANDARD',
          lcdDecimals: 1,
          lcdVisible: false,
          titleFontFamily: 'Arial',
          unitFontFamily: 'Arial'
        },
        sections: [],
        valueGradientStops: [],
        indicatorBehavior: { glowOnThreshold: true, trackingEnabled: false },
        indicators: { alerts: [], ledVisible: false, userLedVisible: false, threshold: undefined }
      },
      value: 42,
      surface: createMockSurface()
    })

    expect(overlayRender).toHaveBeenCalledTimes(1)
  })

  it('rejects duplicate and empty extension ids', () => {
    const registry = createExtensionRegistry<RadialBargraphGaugeConfig>()

    registry.register({
      id: 'needle-main',
      point: 'needle',
      render: () => undefined
    })

    expect(() =>
      registry.register({
        id: 'needle-main',
        point: 'needle',
        render: () => undefined
      })
    ).toThrowError('extension id already registered: needle-main')

    expect(() =>
      registry.register({
        id: ' ',
        point: 'overlay',
        render: () => undefined
      })
    ).toThrowError('extension id must not be empty')
  })
})
