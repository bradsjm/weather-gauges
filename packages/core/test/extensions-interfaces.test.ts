import { describe, expect, it, vi } from 'vitest'

import type {
  MarkerExtension,
  NeedleVariantExtension,
  OverlayExtension,
  RadialGaugeConfig,
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
    const registry = createExtensionRegistry<RadialGaugeConfig>()

    const overlayRender = vi.fn()
    const markerRender = vi.fn()
    const needleRender = vi.fn()

    const overlay: OverlayExtension<RadialGaugeConfig> = {
      id: 'overlay-grid',
      point: 'overlay',
      render: overlayRender
    }

    const marker: MarkerExtension<RadialGaugeConfig> = {
      id: 'marker-threshold',
      point: 'marker',
      markerValue: 75,
      render: markerRender
    }

    const needle: NeedleVariantExtension<RadialGaugeConfig> = {
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
    const registry = createExtensionRegistry<RadialGaugeConfig>()
    const overlayRender = vi.fn()

    const overlay: OverlayExtension<RadialGaugeConfig> = {
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
      gaugeKind: 'radial',
      config: {
        value: { min: 0, max: 100, current: 42 },
        size: { width: 200, height: 200 },
        animation: { enabled: true, durationMs: 500, easing: 'easeInOutCubic' },
        visibility: { showFrame: true, showBackground: true, showForeground: true, showLcd: true },
        text: { title: 'Pressure', unit: 'psi' }
      },
      value: 42,
      surface: createMockSurface()
    })

    expect(overlayRender).toHaveBeenCalledTimes(1)
  })

  it('rejects duplicate and empty extension ids', () => {
    const registry = createExtensionRegistry<RadialGaugeConfig>()

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
