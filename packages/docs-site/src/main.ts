import '@bradsjm/weather-gauges-elements'

import { renderCompassPage } from './pages/compass-page'
import { renderIndexPage } from './pages/index-page'
import { renderRadialBargraphPage } from './pages/radial-bargraph-page'
import { renderRadialPage } from './pages/radial-page'
import { renderWindPage } from './pages/wind-direction-page'
import { renderWindRosePage } from './pages/wind-rose-page'
import { currentRoute, renderShell } from './shell'

const app = document.querySelector<HTMLDivElement>('#app')

let disposePageEffects: (() => void) | null = null

const renderPage = (): void => {
  disposePageEffects?.()
  disposePageEffects = null

  if (!app) {
    return
  }

  const route = currentRoute()
  app.innerHTML = renderShell(route)
  const root = app.querySelector('#page-root') as HTMLDivElement

  if (route === '/radial') {
    renderRadialPage(root)
  } else if (route === '/radial-bargraph') {
    renderRadialBargraphPage(root)
  } else if (route === '/compass') {
    renderCompassPage(root)
  } else if (route === '/wind-direction') {
    renderWindPage(root)
  } else if (route === '/wind-rose') {
    renderWindRosePage(root)
  } else {
    disposePageEffects = renderIndexPage(root)
  }

  app.querySelectorAll('a[data-nav="true"]').forEach((link) => {
    link.addEventListener('click', (event) => {
      const anchor = event.currentTarget as HTMLAnchorElement
      const target = anchor.getAttribute('href')
      if (!target) {
        return
      }
      event.preventDefault()
      if (window.location.pathname !== target) {
        window.history.pushState({}, '', target)
      }
      renderPage()
    })
  })
}

window.addEventListener('popstate', renderPage)
renderPage()
