import type { RenderSurface } from '../render/context.js'

export type ExtensionPoint = 'overlay' | 'marker' | 'needle'

export type GaugeKind = 'radial' | 'linear' | 'compass'

export type ExtensionRenderContext<TConfig> = {
  gaugeKind: GaugeKind
  config: TConfig
  value: number
  surface: RenderSurface
}

type BaseExtension<TConfig, TPoint extends ExtensionPoint> = {
  id: string
  point: TPoint
  render: (context: ExtensionRenderContext<TConfig>) => void
}

export type OverlayExtension<TConfig> = BaseExtension<TConfig, 'overlay'>

export type MarkerExtension<TConfig> = BaseExtension<TConfig, 'marker'> & {
  markerValue: number
}

export type NeedleVariantExtension<TConfig> = BaseExtension<TConfig, 'needle'>

export type GaugeExtension<TConfig> =
  | OverlayExtension<TConfig>
  | MarkerExtension<TConfig>
  | NeedleVariantExtension<TConfig>

export type ExtensionRegistry<TConfig> = {
  register: (extension: GaugeExtension<TConfig>) => void
  unregister: (id: string) => void
  getById: (id: string) => GaugeExtension<TConfig> | undefined
  list: (point?: ExtensionPoint) => GaugeExtension<TConfig>[]
}

const assertExtensionId = (id: string): void => {
  if (id.trim().length === 0) {
    throw new Error('extension id must not be empty')
  }
}

export const createExtensionRegistry = <TConfig>(): ExtensionRegistry<TConfig> => {
  const extensions = new Map<string, GaugeExtension<TConfig>>()

  return {
    register: (extension) => {
      assertExtensionId(extension.id)
      if (extensions.has(extension.id)) {
        throw new Error(`extension id already registered: ${extension.id}`)
      }

      extensions.set(extension.id, extension)
    },
    unregister: (id) => {
      assertExtensionId(id)
      extensions.delete(id)
    },
    getById: (id) => {
      assertExtensionId(id)
      return extensions.get(id)
    },
    list: (point) => {
      const all = [...extensions.values()]
      if (point === undefined) {
        return all
      }

      return all.filter((extension) => extension.point === point)
    }
  }
}
