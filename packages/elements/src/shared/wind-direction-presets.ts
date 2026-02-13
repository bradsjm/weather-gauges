export type WindDirectionPreset = '' | 'wind-direction'

type ResolveWindDirectionTextInput = {
  preset: WindDirectionPreset
  title: string
  unit: string
  lcdTitleLatest: string
  lcdTitleAverage: string
  hasTitleAttr: boolean
  hasUnitAttr: boolean
  hasLcdTitleLatestAttr: boolean
  hasLcdTitleAverageAttr: boolean
}

export type WindDirectionTextDefaults = {
  title: string
  unit: string
  lcdTitleLatest: string
  lcdTitleAverage: string
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
    lcdTitleLatest:
      input.hasLcdTitleLatestAttr || input.lcdTitleLatest.length > 0
        ? input.lcdTitleLatest
        : hasPreset
          ? 'Latest'
          : '',
    lcdTitleAverage:
      input.hasLcdTitleAverageAttr || input.lcdTitleAverage.length > 0
        ? input.lcdTitleAverage
        : hasPreset
          ? 'Average'
          : ''
  }
}
