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

const resolveGaugeAlerts = <TAlert>(
  alerts: readonly TAlert[],
  predicate: (alert: TAlert) => boolean,
  sorter?: (left: TAlert, right: TAlert) => number
): TAlert[] => {
  const activeAlerts = alerts.filter(predicate)
  if (!sorter) {
    return activeAlerts
  }

  return activeAlerts.sort(sorter)
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
  return resolveGaugeAlerts(alerts, (alert) => Math.abs(alert.heading - heading) <= tolerance)
}

export const resolveGaugeValueAlerts = <TAlert extends ValueAlert>(
  value: number,
  alerts: readonly TAlert[]
): TAlert[] => {
  return resolveGaugeAlerts(
    alerts,
    (alert) => value >= alert.value,
    (left, right) => right.value - left.value
  )
}
