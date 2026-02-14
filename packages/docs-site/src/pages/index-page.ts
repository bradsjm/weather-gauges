import { applyGaugeProps } from '../gauge-utils'
import { minMaxAreaColor, temperatureSections } from '../options'

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
    <h1 class="page-title">Weather Gauge Showcase</h1>
    <p class="page-subtitle">Weather-focused gauge presets and styles at a consistent 220px size. Cards show purpose-driven examples with varied frames and visual treatments.</p>
    <div class="index-grid" id="index-grid"></div>
  `

  const grid = root.querySelector('#index-grid') as HTMLDivElement
  const cards: Array<{
    title: string
    kind: IndexGaugeKind
    create: () => HTMLElement
  }> = [
    {
      title: 'Temperature',
      kind: 'value',
      create: () => {
        const node = document.createElement('wx-gauge')
        applyGaugeProps(node, {
          title: 'Air Temperature',
          preset: 'temperature',
          size: 220,
          value: 19.4,
          frameDesign: 'tiltedGray',
          backgroundColor: 'beige',
          foregroundType: 'top-arc-glass',
          gaugeType: 'full-gap',
          pointerType: 'curved-classic-needle',
          pointerColor: 'red',
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
      title: 'Temperature (Imperial)',
      kind: 'value',
      create: () => {
        const node = document.createElement('wx-gauge')
        applyGaugeProps(node, {
          title: 'Air Temperature',
          preset: 'temperature',
          unit: '°F',
          size: 220,
          value: 71,
          threshold: 95,
          showThreshold: true,
          frameDesign: 'steel',
          backgroundColor: 'light-gray',
          foregroundType: 'side-reflection-glass',
          pointerType: 'slim-angular-needle',
          pointerColor: 'orange',
          gaugeType: 'three-quarter',
          animateValue: true
        })
        return node
      }
    },
    {
      title: 'Barometric Pressure',
      kind: 'value',
      create: () => {
        const node = document.createElement('wx-gauge')
        applyGaugeProps(node, {
          title: 'Pressure',
          preset: 'pressure',
          unit: 'hPa',
          size: 220,
          value: 1015,
          threshold: 1022,
          showThreshold: true,
          frameDesign: 'chrome',
          backgroundColor: 'satin-gray',
          foregroundType: 'dome-glass',
          pointerType: 'heavy-metallic-needle',
          pointerColor: 'blue',
          trendVisible: true,
          trendState: 'up',
          animateValue: true
        })
        return node
      }
    },
    {
      title: 'Humidity',
      kind: 'value',
      create: () => {
        const node = document.createElement('wx-bargraph')
        applyGaugeProps(node, {
          title: 'Humidity',
          preset: 'humidity',
          size: 220,
          value: 63,
          threshold: 80,
          animateValue: true,
          frameDesign: 'metal',
          backgroundColor: 'light-gray',
          foregroundType: 'top-arc-glass',
          gaugeType: 'full-gap',
          valueColor: 'blue'
        })
        return node
      }
    },
    {
      title: 'Rainfall',
      kind: 'value',
      create: () => {
        const node = document.createElement('wx-bargraph')
        applyGaugeProps(node, {
          title: 'Rainfall',
          preset: 'rainfall',
          size: 220,
          value: 4.2,
          threshold: 7,
          frameDesign: 'brass',
          backgroundColor: 'beige',
          foregroundType: 'dome-glass',
          gaugeType: 'three-quarter',
          valueColor: 'blue',
          lcdColor: 'standard-green',
          useValueGradient: true,
          digitalFont: true,
          animateValue: true
        })
        return node
      }
    },
    {
      title: 'Rain Rate',
      kind: 'value',
      create: () => {
        const node = document.createElement('wx-bargraph')
        applyGaugeProps(node, {
          title: 'Rain Rate',
          preset: 'rain-rate',
          size: 220,
          value: 2.8,
          threshold: 6,
          frameDesign: 'chrome',
          backgroundColor: 'satin-gray',
          foregroundType: 'side-reflection-glass',
          gaugeType: 'half',
          valueColor: 'cyan',
          animateValue: true
        })
        return node
      }
    },
    {
      title: 'Cloud Base',
      kind: 'value',
      create: () => {
        const node = document.createElement('wx-bargraph')
        applyGaugeProps(node, {
          title: 'Cloud Base',
          preset: 'cloud-base',
          size: 220,
          value: 540,
          threshold: 300,
          frameDesign: 'glossyMetal',
          backgroundColor: 'dark-gray',
          foregroundType: 'center-glow-glass',
          gaugeType: 'full-gap',
          valueColor: 'orange',
          lcdColor: 'blue',
          animateValue: true
        })
        return node
      }
    },
    {
      title: 'Solar Radiation',
      kind: 'value',
      create: () => {
        const node = document.createElement('wx-gauge')
        applyGaugeProps(node, {
          title: 'Solar',
          preset: 'solar',
          size: 220,
          value: 680,
          threshold: 900,
          frameDesign: 'gold',
          backgroundColor: 'white',
          foregroundType: 'sweep-glass',
          pointerType: 'teardrop-bulb-needle',
          pointerColor: 'yellow',
          animateValue: true
        })
        return node
      }
    },
    {
      title: 'UV Index',
      kind: 'value',
      create: () => {
        const node = document.createElement('wx-gauge')
        applyGaugeProps(node, {
          title: 'UV Index',
          preset: 'uv-index',
          unit: '',
          size: 220,
          value: 6.5,
          threshold: 8,
          frameDesign: 'anthracite',
          backgroundColor: 'light-gray',
          foregroundType: 'center-glow-glass',
          pointerType: 'narrow-spike-needle',
          pointerColor: 'magenta',
          animateValue: true
        })
        return node
      }
    },
    {
      title: 'Wind Speed',
      kind: 'value',
      create: () => {
        const node = document.createElement('wx-gauge')
        applyGaugeProps(node, {
          title: 'Wind Speed',
          preset: 'wind-speed',
          unit: 'km/h',
          size: 220,
          value: 17,
          threshold: 22,
          frameDesign: 'tiltedBlack',
          backgroundColor: 'satin-gray',
          foregroundType: 'top-arc-glass',
          gaugeType: 'three-quarter',
          pointerType: 'diamond-spear-needle',
          pointerColor: 'green',
          trendVisible: true,
          trendState: 'up',
          animateValue: true
        })
        return node
      }
    },
    {
      title: 'Wind Direction',
      kind: 'wind',
      create: () => {
        const node = document.createElement('wx-wind-direction')
        applyGaugeProps(node, {
          title: 'Wind Direction',
          unit: 'deg',
          size: 220,
          valueLatest: 45,
          valueAverage: 60,
          frameDesign: 'shinyMetal',
          backgroundColor: 'satin-gray',
          pointerTypeLatest: 'classic-compass-needle',
          pointerTypeAverage: 'curved-classic-needle',
          pointerColorLatest: 'red',
          pointerColorAverage: 'blue',
          showDegreeScale: true,
          showPointSymbols: true,
          showRose: true,
          animateValue: true
        })
        return node
      }
    },
    {
      title: 'Wind Direction (Marine)',
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
          backgroundColor: 'beige',
          pointerColorLatest: 'green',
          pointerColorAverage: 'orange',
          knobType: 'metalKnob',
          knobStyle: 'brass',
          foregroundType: 'dome-glass',
          lcdColor: 'standard-green',
          digitalFont: true,
          showDegreeScale: true,
          showRose: true,
          animateValue: true
        })
        return node
      }
    },
    {
      title: 'Compass Heading',
      kind: 'heading',
      create: () => {
        const node = document.createElement('wx-compass')
        applyGaugeProps(node, {
          title: 'Heading',
          unit: 'deg',
          size: 220,
          heading: 92,
          frameDesign: 'metal',
          backgroundColor: 'beige',
          foregroundType: 'top-arc-glass',
          lcdColor: 'standard',
          digitalFont: false,
          animateValue: true
        })
        return node
      }
    },
    {
      title: 'Compass Heading (Marine)',
      kind: 'heading',
      create: () => {
        const node = document.createElement('wx-compass')
        applyGaugeProps(node, {
          title: 'Marine Heading',
          unit: 'deg',
          size: 220,
          heading: 184,
          frameDesign: 'brass',
          backgroundColor: 'beige',
          pointerType: 'classic-compass-needle',
          pointerColor: 'blue',
          knobType: 'metalKnob',
          knobStyle: 'brass',
          foregroundType: 'dome-glass',
          rotateFace: true,
          lcdColor: 'standard-green',
          digitalFont: true,
          animateValue: true
        })
        return node
      }
    },
    {
      title: 'Wind Rose Overview',
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
          backgroundColor: 'beige',
          foregroundType: 'top-arc-glass',
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
      title: 'Wind Rose (Marine)',
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
          backgroundColor: 'beige',
          foregroundType: 'dome-glass',
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
    `
    const stage = article.querySelector('.demo-stage') as HTMLDivElement
    const gauge = card.create()
    stage.append(gauge)
    indexGauges.push({ element: gauge, kind: card.kind })
    grid.append(article)
  })

  return setupIndexGaugeAnimation(indexGauges)
}
