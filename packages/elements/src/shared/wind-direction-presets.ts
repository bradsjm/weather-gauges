export type WindDirectionPreset = '' | 'wind-direction'

type ResolveWindDirectionTextInput = {
  preset: WindDirectionPreset
  title: string
  unit: string
  averageLabel: string
  hasTitleAttr: boolean
  hasUnitAttr: boolean
  hasAverageLabelAttr: boolean
}

export type WindDirectionTextDefaults = {
  title: string
  unit: string
  latestLabel: string
  averageLabel: string
}

export const resolveWindDirectionTextDefaults = (
  input: ResolveWindDirectionTextInput
): WindDirectionTextDefaults => {
  const hasPreset = input.preset === 'wind-direction'

  return {
    title:
      input.hasTitleAttr || input.title.length > 0
        ? input.title
        : hasPreset
          ? 'Wind Direction'
          : '',
    unit: input.hasUnitAttr || input.unit.length > 0 ? input.unit : hasPreset ? '°' : '',
    latestLabel: hasPreset ? 'Latest' : '',
    averageLabel:
      input.hasAverageLabelAttr || input.averageLabel.length > 0
        ? input.averageLabel
        : hasPreset
          ? 'Average'
          : ''
  }
}
