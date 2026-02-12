export const booleanAttributeConverter = {
  fromAttribute: (value: string | null) => value !== null && value !== 'false'
}

export const readCssCustomPropertyColor = (
  element: Element,
  propertyName: string,
  fallback: string
): string => {
  const value = getComputedStyle(element).getPropertyValue(propertyName).trim()
  return value.length > 0 ? value : fallback
}
