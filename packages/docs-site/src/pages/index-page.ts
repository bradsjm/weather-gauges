import { applyGaugeProps } from '../gauge-utils'
import { minMaxAreaColor, temperatureSections } from '../options'
import type { Route } from '../types'

type IndexGaugeKind = 'value' | 'heading' | 'wind' | 'wind-rose'

type RosePetal = {
  direction: number
  value: number
  color?: string
}

const circularDistance = (left: number, right: number): number => {
  const delta = Math.abs(left - right)
  return Math.min(delta, 360 - delta)
}

const buildWindRosePetals = (
  binCount: 8 | 16 | 32,
  maxValue: number,
  primaryDirection: number,
  secondaryDirection: number
): RosePetal[] => {
  const binStep = 360 / binCount
  const petals: RosePetal[] = []

  for (let index = 0; index < binCount; index += 1) {
    const direction = index * binStep
    const primaryDistance = circularDistance(direction, primaryDirection)
    const secondaryDistance = circularDistance(direction, secondaryDirection)
    const primaryContribution = 68 * Math.exp(-(primaryDistance * primaryDistance) / (2 * 34 * 34))
    const secondaryContribution =
      24 * Math.exp(-(secondaryDistance * secondaryDistance) / (2 * 48 * 48))
    const value = Math.min(maxValue, 5 + primaryContribution + secondaryContribution)

    petals.push({
      direction,
      value: Number(value.toFixed(1))
    })
  }

  const westIndex = Math.round(270 / binStep) % binCount
  const westPetal = petals[westIndex]
  if (westPetal) {
    westPetal.color = '#4f8cff'
  }

  return petals
}

type IndexGaugeEntry = {
  element: HTMLElement
  kind: IndexGaugeKind
}

const setupIndexGaugeAnimation = (gauges: IndexGaugeEntry[]): (() => void) => {
  const visibleGauges = new Set<HTMLElement>()

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        const target = entry.target as HTMLElement
        if (entry.isIntersecting) {
          visibleGauges.add(target)
        } else {
          visibleGauges.delete(target)
        }
      })
    },
    { threshold: 0.2 }
  )

  gauges.forEach((gauge) => observer.observe(gauge.element))

  const updateVisibleGauges = (): void => {
    if (visibleGauges.size === 0) {
      return
    }

    const normalizedValue = Math.random()
    const scalarValue = Number((normalizedValue * 100).toFixed(1))
    const headingValue = Math.round(normalizedValue * 359)
    const latestWindValue = headingValue
    const averageWindValue = Math.round(Math.random() * 359)
    const rosePrimaryDirection = Math.round(Math.random() * 359)
    const roseSecondaryDirection =
      (rosePrimaryDirection + 50 + Math.round(Math.random() * 70)) % 360
    const roseMaxValue = 100
    const rosePetals = buildWindRosePetals(
      16,
      roseMaxValue,
      rosePrimaryDirection,
      roseSecondaryDirection
    )

    gauges.forEach((gauge) => {
      if (!visibleGauges.has(gauge.element)) {
        return
      }

      if (gauge.kind === 'value') {
        applyGaugeProps(gauge.element, { value: scalarValue })
        return
      }

      if (gauge.kind === 'heading') {
        applyGaugeProps(gauge.element, { heading: headingValue })
        return
      }

      if (gauge.kind === 'wind-rose') {
        applyGaugeProps(gauge.element, {
          petals: rosePetals,
          maxValue: roseMaxValue
        })
        return
      }

      applyGaugeProps(gauge.element, {
        valueLatest: latestWindValue,
        valueAverage: averageWindValue
      })
    })
  }

  updateVisibleGauges()
  const intervalId = window.setInterval(updateVisibleGauges, 5000)

  return () => {
    window.clearInterval(intervalId)
    observer.disconnect()
    visibleGauges.clear()
  }
}

export const renderIndexPage = (root: HTMLElement): (() => void) => {
  root.innerHTML = `
    <h1 class="page-title">SteelSeries v3 Showcase</h1>
    <p class="page-subtitle">Every preview uses a consistent 220px gauge size. Each card highlights significant visual variations across radial, radial-bargraph, compass, wind-direction, and wind-rose gauges. Open a gauge page to tweak settings live with documented controls.</p>
    <div class="index-grid" id="index-grid"></div>
  `

  const grid = root.querySelector('#index-grid') as HTMLDivElement
  const cards: Array<{
    title: string
    link: Route
    kind: IndexGaugeKind
    create: () => HTMLElement
  }> = [
    {
      title: 'Radial Temperature Classic',
      link: '/radial',
      kind: 'value',
      create: () => {
        const node = document.createElement('wx-gauge')
        applyGaugeProps(node, {
          title: 'Temperature',
          unit: '°F',
          size: 220,
          minValue: 0,
          maxValue: 100,
          value: 45.1,
          frameDesign: 'tiltedGray',
          backgroundColor: 'BEIGE',
          foregroundType: 'type1',
          gaugeType: 'type4',
          pointerType: 'type8',
          pointerColor: 'RED',
          majorTickCount: 11,
          minorTicksPerMajor: 5,
          ledVisible: false,
          userLedVisible: true,
          trendVisible: true,
          trendState: 'down',
          segments: temperatureSections,
          areas: [{ from: 30, to: 76, color: minMaxAreaColor }],
          animateValue: true
        })
        return node
      }
    },
    {
      title: 'Radial Needle',
      link: '/radial',
      kind: 'value',
      create: () => {
        const node = document.createElement('wx-gauge')
        applyGaugeProps(node, {
          title: 'Boiler',
          unit: 'bar',
          size: 220,
          value: 58,
          threshold: 72,
          showThreshold: true,
          pointerType: 'type2',
          pointerColor: 'ORANGE',
          gaugeType: 'type4',
          animateValue: true
        })
        return node
      }
    },
    {
      title: 'Radial Precision',
      link: '/radial',
      kind: 'value',
      create: () => {
        const node = document.createElement('wx-gauge')
        applyGaugeProps(node, {
          title: 'Vacuum',
          unit: 'kPa',
          size: 220,
          value: 42,
          threshold: 50,
          showThreshold: true,
          frameDesign: 'brass',
          backgroundColor: 'BEIGE',
          foregroundType: 'type3',
          pointerType: 'type8',
          pointerColor: 'BLUE',
          minMeasuredValueVisible: true,
          minMeasuredValue: 18,
          maxMeasuredValueVisible: true,
          maxMeasuredValue: 67,
          animateValue: true
        })
        return node
      }
    },
    {
      title: 'Radial Reference',
      link: '/radial-bargraph',
      kind: 'value',
      create: () => {
        const node = document.createElement('wx-bargraph')
        applyGaugeProps(node, {
          title: 'Pressure',
          unit: 'psi',
          size: 220,
          value: 74,
          threshold: 80,
          animateValue: true,
          gaugeType: 'type4'
        })
        return node
      }
    },
    {
      title: 'Radial Gradient + LCD',
      link: '/radial-bargraph',
      kind: 'value',
      create: () => {
        const node = document.createElement('wx-bargraph')
        applyGaugeProps(node, {
          title: 'Temp',
          unit: '°C',
          size: 220,
          value: 66,
          threshold: 80,
          frameDesign: 'brass',
          backgroundColor: 'BEIGE',
          foregroundType: 'type3',
          gaugeType: 'type3',
          valueColor: 'GREEN',
          lcdColor: 'BLUE',
          useValueGradient: true,
          digitalFont: true,
          trendVisible: true,
          trendState: 'up',
          animateValue: true
        })
        return node
      }
    },
    {
      title: 'Compass Default',
      link: '/compass',
      kind: 'heading',
      create: () => {
        const node = document.createElement('wx-compass')
        applyGaugeProps(node, {
          title: 'Heading',
          unit: 'deg',
          size: 220,
          heading: 92,
          animateValue: true
        })
        return node
      }
    },
    {
      title: 'Compass Marine',
      link: '/compass',
      kind: 'heading',
      create: () => {
        const node = document.createElement('wx-compass')
        applyGaugeProps(node, {
          title: 'Marine',
          unit: 'deg',
          size: 220,
          heading: 184,
          frameDesign: 'brass',
          backgroundColor: 'BEIGE',
          pointerType: 'type1',
          pointerColor: 'BLUE',
          knobType: 'metalKnob',
          knobStyle: 'brass',
          foregroundType: 'type3',
          animateValue: true
        })
        return node
      }
    },
    {
      title: 'Wind Dual Pointer',
      link: '/wind-direction',
      kind: 'wind',
      create: () => {
        const node = document.createElement('wx-wind-direction')
        applyGaugeProps(node, {
          title: 'Wind',
          unit: 'deg',
          size: 220,
          valueLatest: 45,
          valueAverage: 60,
          frameDesign: 'shinyMetal',
          backgroundColor: 'SATIN_GRAY',
          pointerTypeLatest: 'type1',
          pointerTypeAverage: 'type8',
          pointerColorLatest: 'RED',
          pointerColorAverage: 'BLUE',
          showDegreeScale: true,
          showPointSymbols: true,
          showRose: true,
          animateValue: true
        })
        return node
      }
    },
    {
      title: 'Wind Marine',
      link: '/wind-direction',
      kind: 'wind',
      create: () => {
        const node = document.createElement('wx-wind-direction')
        applyGaugeProps(node, {
          title: 'Marine Wind',
          unit: '',
          size: 220,
          valueLatest: 275,
          valueAverage: 265,
          frameDesign: 'brass',
          backgroundColor: 'BEIGE',
          pointerColorLatest: 'GREEN',
          pointerColorAverage: 'ORANGE',
          knobType: 'metalKnob',
          knobStyle: 'brass',
          foregroundType: 'type3',
          lcdColor: 'STANDARD_GREEN',
          digitalFont: true,
          showDegreeScale: true,
          showRose: true,
          animateValue: true
        })
        return node
      }
    },
    {
      title: 'Wind Rose Default',
      link: '/wind-rose',
      kind: 'wind-rose',
      create: () => {
        const node = document.createElement('wx-wind-rose')
        applyGaugeProps(node, {
          title: 'Wind Rose',
          unit: 'miles',
          size: 220,
          maxValue: 100,
          petals: buildWindRosePetals(16, 100, 250, 302),
          frameDesign: 'metal',
          backgroundColor: 'BEIGE',
          foregroundType: 'type1',
          roseCenterColor: '#f5a68a',
          roseEdgeColor: '#d6452f',
          roseLineColor: '#8d2f1f',
          roseCenterAlpha: 0.25,
          roseEdgeAlpha: 0.7,
          showPointSymbols: true,
          showTickmarks: true,
          showDegreeScale: false,
          animateValue: true
        })
        return node
      }
    },
    {
      title: 'Wind Rose Marine',
      link: '/wind-rose',
      kind: 'wind-rose',
      create: () => {
        const node = document.createElement('wx-wind-rose')
        applyGaugeProps(node, {
          title: 'Marine Rose',
          unit: 'kts',
          size: 220,
          maxValue: 120,
          petals: buildWindRosePetals(32, 120, 278, 328),
          frameDesign: 'brass',
          backgroundColor: 'BEIGE',
          foregroundType: 'type3',
          roseCenterColor: '#9ec5ff',
          roseEdgeColor: '#2b5ebf',
          roseLineColor: '#1d438a',
          roseCenterAlpha: 0.2,
          roseEdgeAlpha: 0.72,
          showPointSymbols: true,
          showTickmarks: true,
          showDegreeScale: false,
          animateValue: true
        })
        return node
      }
    }
  ]

  const indexGauges: IndexGaugeEntry[] = []

  cards.forEach((card) => {
    const article = document.createElement('article')
    article.className = 'demo-card'
    article.innerHTML = `
      <h3>${card.title}</h3>
      <div class="demo-stage"></div>
      <a class="card-link" href="${card.link}" data-nav="true">Open ${card.link.slice(1) || 'index'} controls</a>
    `
    const stage = article.querySelector('.demo-stage') as HTMLDivElement
    const gauge = card.create()
    stage.append(gauge)
    indexGauges.push({ element: gauge, kind: card.kind })
    grid.append(article)
  })

  return setupIndexGaugeAnimation(indexGauges)
}
