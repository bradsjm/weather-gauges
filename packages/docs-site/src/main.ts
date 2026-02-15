import '@fontsource-variable/geologica/wght.css'
import '@fontsource/ibm-plex-mono/400.css'
import '@fontsource/ibm-plex-mono/600.css'

import '@bradsjm/weather-gauges-elements'

import { renderCompassPage } from './pages/compass-page'
import { renderConceptsPage } from './pages/concepts-page'
import { renderIndexPage } from './pages/index-page'
import { renderIntegrationsPage } from './pages/integrations-page'
import { renderRadialBargraphPage } from './pages/radial-bargraph-page'
import { renderRadialPage } from './pages/radial-page'
import { renderStartHerePage } from './pages/start-here-page'
import { renderThemingPage } from './pages/theming-page'
import { renderTroubleshootingPage } from './pages/troubleshooting-page'
import { renderWindPage } from './pages/wind-direction-page'
import { renderWindRosePage } from './pages/wind-rose-page'
import { currentRoute, renderShell } from './shell'

const app = document.querySelector<HTMLDivElement>('#app')

let disposePageEffects: (() => void) | null = null
let shellAbort: AbortController | null = null
let lastRoute: string | null = null

const setupShell = (): void => {
  shellAbort?.abort()
  shellAbort = new AbortController()
  const { signal } = shellAbort

  const shell = document.querySelector<HTMLDivElement>('.docs-shell')
  const toggle = document.querySelector<HTMLButtonElement>('button[data-shell-toggle="sidebar"]')
  const sidebar = document.querySelector<HTMLElement>('#sidebar')
  const search = document.querySelector<HTMLInputElement>('#doc-search')
  const navLinks = Array.from(document.querySelectorAll<HTMLAnchorElement>('a[data-nav="true"]'))

  const setSidebar = (open: boolean): void => {
    if (!shell || !toggle) {
      return
    }
    shell.dataset.sidebar = open ? 'open' : 'closed'
    toggle.setAttribute('aria-expanded', open ? 'true' : 'false')
  }

  toggle?.addEventListener(
    'click',
    () => {
      const open = shell?.dataset.sidebar === 'open'
      setSidebar(!open)
    },
    { signal }
  )

  const filterNav = (query: string): void => {
    const q = query.trim().toLowerCase()
    navLinks.forEach((link) => {
      const title = (link.getAttribute('data-title') ?? link.textContent ?? '').toLowerCase()
      const keywords = (link.getAttribute('data-keywords') ?? '').toLowerCase()
      const keep = q.length === 0 || title.includes(q) || keywords.includes(q)
      link.hidden = !keep
    })
  }

  search?.addEventListener('input', () => filterNav(search.value), { signal })
  filterNav(search?.value ?? '')

  navLinks.forEach((link) => {
    link.addEventListener(
      'click',
      (event) => {
        // Respect "open in new tab" and similar browser gestures.
        if (
          event.defaultPrevented ||
          event.button !== 0 ||
          event.metaKey ||
          event.ctrlKey ||
          event.shiftKey ||
          event.altKey
        ) {
          return
        }

        const target = link.getAttribute('href')
        if (!target) {
          return
        }

        const routeTarget = target.startsWith('#') ? target.slice(1) : target
        if (!routeTarget.startsWith('/')) {
          return
        }

        event.preventDefault()

        // Close sidebar overlay on mobile.
        setSidebar(false)

        if (currentRoute() !== routeTarget) {
          window.location.hash = routeTarget
        } else {
          renderPage()
        }

        // Ensure focus lands in main content after navigation.
        window.setTimeout(() => {
          const main = document.querySelector<HTMLElement>('#page-root')
          main?.focus({ preventScroll: true })
        }, 0)
      },
      { signal }
    )
  })

  // Close the sidebar if focus moves outside it on mobile.
  document.addEventListener(
    'click',
    (event) => {
      if (!shell || shell.dataset.sidebar !== 'open') {
        return
      }
      const target = event.target as Node
      if (sidebar?.contains(target) || toggle?.contains(target)) {
        return
      }
      setSidebar(false)
    },
    { signal }
  )
}

window.addEventListener('keydown', (event) => {
  if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') {
    const input = document.querySelector<HTMLInputElement>('#doc-search')
    if (input) {
      event.preventDefault()
      input.focus()
    }
  }
})

const renderPage = (): void => {
  disposePageEffects?.()
  disposePageEffects = null

  if (!app) {
    return
  }

  const route = currentRoute()
  const routeChanged = lastRoute !== route
  lastRoute = route
  app.innerHTML = renderShell(route)
  const root = app.querySelector('#page-root') as HTMLDivElement

  if (routeChanged) {
    window.scrollTo(0, 0)
  }

  setupShell()

  if (route === '/start-here') {
    renderStartHerePage(root)
  } else if (route === '/concepts') {
    renderConceptsPage(root)
  } else if (route === '/theming') {
    renderThemingPage(root)
  } else if (route === '/integrations') {
    renderIntegrationsPage(root)
  } else if (route === '/troubleshooting') {
    renderTroubleshootingPage(root)
  } else if (route === '/radial') {
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
}

window.addEventListener('hashchange', renderPage)
renderPage()
