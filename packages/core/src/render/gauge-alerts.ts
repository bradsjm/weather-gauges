export type GaugeTone = 'accent' | 'warning' | 'danger'

type AlertSeverity = 'info' | 'warning' | 'critical'

type SeverityAlert = {
  severity: AlertSeverity
}

type HeadingAlert = SeverityAlert & {
  heading: number
}

type ValueAlert = SeverityAlert & {
  value: number
}

export const resolveGaugeToneFromAlerts = (
  alerts: readonly SeverityAlert[],
  thresholdBreached = false
): GaugeTone => {
  if (alerts.some((alert) => alert.severity === 'critical')) {
    return 'danger'
  }

  if (alerts.some((alert) => alert.severity === 'warning') || thresholdBreached) {
    return 'warning'
  }

  return 'accent'
}

export const resolveGaugeHeadingAlerts = <TAlert extends HeadingAlert>(
  heading: number,
  alerts: readonly TAlert[],
  tolerance = 8
): TAlert[] => {
  return alerts.filter((alert) => Math.abs(alert.heading - heading) <= tolerance)
}

export const resolveGaugeValueAlerts = <TAlert extends ValueAlert>(
  value: number,
  alerts: readonly TAlert[]
): TAlert[] => {
  return alerts
    .filter((alert) => value >= alert.value)
    .sort((left, right) => right.value - left.value)
}
