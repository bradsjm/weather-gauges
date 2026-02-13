import type { Route } from './types'

const rootStyles = `
  .docs-shell {
    min-height: 100vh;
    background: linear-gradient(145deg, #f6f3ec 0%, #e8eef6 60%, #f7f9fc 100%);
    color: #10243a;
    font-family: 'Avenir Next', 'Gill Sans', 'Trebuchet MS', sans-serif;
  }
  .docs-nav {
    display: flex;
    gap: 0.45rem;
    padding: 1rem 1.25rem;
    border-bottom: 1px solid rgba(16, 36, 58, 0.12);
    backdrop-filter: blur(2px);
    position: sticky;
    top: 0;
    background: rgba(247, 249, 252, 0.92);
    z-index: 2;
  }
  .docs-nav a {
    text-decoration: none;
    color: #284766;
    font-weight: 600;
    letter-spacing: 0.02em;
    padding: 0.45rem 0.7rem;
    border-radius: 999px;
  }
  .docs-nav a.active {
    background: #284766;
    color: #f6f8fb;
  }
  .docs-main {
    padding: 1.5rem;
    max-width: 1320px;
    margin: 0 auto;
  }
  .page-title {
    margin: 0 0 0.35rem;
    font-size: 1.45rem;
    letter-spacing: 0.01em;
  }
  .page-subtitle {
    margin: 0 0 1.25rem;
    color: #355577;
    max-width: 78ch;
  }
  .index-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
    gap: 1rem;
  }
  .demo-card {
    background: #ffffff;
    border: 1px solid rgba(16, 36, 58, 0.12);
    border-radius: 16px;
    padding: 0.9rem;
    box-shadow: 0 10px 24px rgba(16, 36, 58, 0.08);
  }
  .demo-card h3 {
    margin: 0 0 0.35rem;
    font-size: 0.86rem;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    color: #3a5e80;
  }
  .demo-stage {
    min-height: 235px;
    display: grid;
    place-items: center;
  }
  .page-layout {
    display: grid;
    grid-template-columns: minmax(380px, 520px) minmax(320px, 1fr);
    gap: 1rem;
    align-items: start;
  }
  .gauge-panel,
  .control-panel {
    background: #ffffff;
    border: 1px solid rgba(16, 36, 58, 0.12);
    border-radius: 16px;
    padding: 1rem;
    box-shadow: 0 10px 24px rgba(16, 36, 58, 0.08);
  }
  .gauge-panel {
    display: grid;
    gap: 0.75rem;
    justify-items: center;
  }
  .control-grid {
    display: grid;
    gap: 0.4rem;
  }
  .control-item {
    border: 1px solid rgba(30, 55, 81, 0.16);
    border-radius: 10px;
    padding: 0.55rem 0.45rem;
    background: #f8fbff;
  }
  .control-item label {
    display: block;
    font-weight: 700;
    color: #1f4363;
    margin-bottom: 0.2rem;
  }
  .control-item p {
    margin: 0.2rem 0 0.45rem;
    font-size: 0.8rem;
    color: #476789;
  }
  .control-item input,
  .control-item select {
    width: 100%;
    box-sizing: border-box;
    border: 1px solid rgba(16, 36, 58, 0.25);
    border-radius: 8px;
    padding: 0.35rem 0.45rem;
    font: inherit;
    color: #10243a;
    background: #ffffff;
  }
  .control-item input[type='checkbox'] {
    width: auto;
    transform: scale(1.1);
    margin-right: 0.55rem;
  }
  .control-inline {
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }
  .setting-reference {
    margin-top: 0.9rem;
    border-top: 1px dashed rgba(16, 36, 58, 0.2);
    padding-top: 0.8rem;
  }
  .setting-reference h4 {
    margin: 0 0 0.45rem;
    font-size: 0.86rem;
    text-transform: uppercase;
    letter-spacing: 0.07em;
    color: #3a5e80;
  }
  .setting-reference ul {
    margin: 0;
    padding-left: 1rem;
    display: grid;
    gap: 0.35rem;
  }
  .setting-reference li {
    font-size: 0.82rem;
    color: #244260;
  }
  .state-preview {
    margin: 0;
    width: 100%;
    background: #0d1d2b;
    color: #d6e3f0;
    border-radius: 10px;
    padding: 0.7rem;
    font-size: 0.72rem;
    overflow: auto;
  }
  .card-link {
    margin-top: 0.55rem;
    display: inline-block;
    color: #214e73;
    font-weight: 700;
    text-decoration: none;
  }
  @media (max-width: 980px) {
    .page-layout {
      grid-template-columns: 1fr;
    }
  }
`

export const currentRoute = (): Route => {
  const path = window.location.pathname
  if (
    path === '/radial' ||
    path === '/radial-bargraph' ||
    path === '/compass' ||
    path === '/wind-direction'
  ) {
    return path
  }

  return '/'
}

export const renderShell = (route: Route): string => {
  const links: Array<{ path: Route; label: string }> = [
    { path: '/', label: 'Index' },
    { path: '/radial', label: 'Radial' },
    { path: '/radial-bargraph', label: 'Radial Bargraph' },
    { path: '/compass', label: 'Compass' },
    { path: '/wind-direction', label: 'Wind Direction' }
  ]

  return `
    <style>${rootStyles}</style>
    <div class="docs-shell">
      <nav class="docs-nav">
        ${links
          .map(
            (link) =>
              `<a href="${link.path}" data-nav="true" class="${route === link.path ? 'active' : ''}">${link.label}</a>`
          )
          .join('')}
      </nav>
      <main class="docs-main" id="page-root"></main>
    </div>
  `
}
