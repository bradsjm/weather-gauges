import '@bradsjm/steelseries-v3-elements'

const setText = (id, value) => {
  const element = document.getElementById(id)
  if (element) {
    element.textContent = value
  }
}

const appendLog = (id, line) => {
  const log = document.getElementById(id)
  if (!log) {
    return
  }

  const timestamp = new Date().toLocaleTimeString()
  log.textContent = `[${timestamp}] ${line}\n${log.textContent}`.trim()
}

const bindGaugeLog = (selector, logId) => {
  const gauge = document.querySelector(selector)
  if (!gauge) {
    return
  }

  gauge.addEventListener('ss3-value-change', (event) => {
    const detail = event.detail
    appendLog(logId, `value-change ${JSON.stringify(detail)}`)
  })

  gauge.addEventListener('ss3-error', (event) => {
    const detail = event.detail
    appendLog(logId, `error ${JSON.stringify(detail)}`)
  })
}

const wireRange = (rangeId, outputId, handler) => {
  const input = document.getElementById(rangeId)
  if (!(input instanceof HTMLInputElement)) {
    return
  }

  const update = () => {
    handler(Number(input.value))
    setText(outputId, input.value)
  }

  input.addEventListener('input', update)
  update()
}

const radial = document.getElementById('radial-main')
const linear = document.getElementById('linear-main')
const compass = document.getElementById('compass-main')

if (compass) {
  compass.showHeadingReadout = false
}

wireRange('radial-value', 'radial-value-out', (value) => {
  radial?.setAttribute('value', String(value))
})

wireRange('linear-value', 'linear-value-out', (value) => {
  linear?.setAttribute('value', String(value))
})

wireRange('compass-heading', 'compass-heading-out', (value) => {
  compass?.setAttribute('heading', String(value))
})

bindGaugeLog('#radial-main', 'radial-log')
bindGaugeLog('#linear-main', 'linear-log')
bindGaugeLog('#compass-main', 'compass-log')
