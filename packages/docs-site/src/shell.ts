import type { Route } from './types'

const rootStyles = `
  :root {
    --topbar-h: 4.15rem;
    --paper: #f3efe6;
    --paper-2: #ece6d8;
    --ink: #0c1520;
    --ink-2: rgba(12, 21, 32, 0.72);
    --ink-3: rgba(12, 21, 32, 0.56);
    --line: rgba(12, 21, 32, 0.14);
    --line-2: rgba(12, 21, 32, 0.22);
    --accent: #ff5a2f;
    --sea: #2aa7a1;
    --shadow: 0 18px 50px rgba(12, 21, 32, 0.14);
    --mono: 'IBM Plex Mono', ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono',
      monospace;
    --sans: 'Geologica Variable', 'Geologica', ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto,
      Helvetica, Arial, 'Apple Color Emoji', 'Segoe UI Emoji';
  }

  * {
    box-sizing: border-box;
  }

  html {
    color: var(--ink);
    background: var(--paper);
  }

  body {
    margin: 0;
  }

  .docs-shell {
    min-height: 100vh;
    color: var(--ink);
    background: radial-gradient(900px 520px at 15% -10%, rgba(42, 167, 161, 0.14), transparent 55%),
      radial-gradient(800px 520px at 95% 0%, rgba(255, 90, 47, 0.12), transparent 58%),
      linear-gradient(180deg, var(--paper) 0%, var(--paper-2) 100%);
    font-family: var(--sans);
    position: relative;
    overflow-x: clip;
  }

  .docs-shell::before {
    content: '';
    position: fixed;
    inset: -40px;
    pointer-events: none;
    opacity: 0.33;
    background:
      repeating-linear-gradient(
        0deg,
        rgba(12, 21, 32, 0.06) 0,
        rgba(12, 21, 32, 0.06) 1px,
        transparent 1px,
        transparent 22px
      ),
      repeating-linear-gradient(
        90deg,
        rgba(12, 21, 32, 0.05) 0,
        rgba(12, 21, 32, 0.05) 1px,
        transparent 1px,
        transparent 34px
      );
    mask-image: radial-gradient(circle at 10% 0%, rgba(0, 0, 0, 0.85), rgba(0, 0, 0, 0.15) 58%, transparent 78%);
  }

  .docs-shell::after {
    content: '';
    position: fixed;
    inset: 0;
    pointer-events: none;
    opacity: 0.12;
    background-image:
      radial-gradient(circle at 20% 30%, rgba(12, 21, 32, 0.7) 1px, transparent 1px),
      radial-gradient(circle at 80% 60%, rgba(12, 21, 32, 0.7) 1px, transparent 1px);
    background-size: 120px 120px;
    mix-blend-mode: multiply;
    filter: blur(0.2px);
  }

  .skip-link {
    position: absolute;
    top: 0.75rem;
    left: 0.75rem;
    transform: translateY(-160%);
    padding: 0.45rem 0.6rem;
    border-radius: 10px;
    border: 1px solid var(--line-2);
    background: rgba(243, 239, 230, 0.92);
    color: var(--ink);
    text-decoration: none;
    font-family: var(--mono);
    font-size: 0.86rem;
    z-index: 40;
  }
  .skip-link:focus {
    transform: translateY(0);
    outline: 2px solid rgba(42, 167, 161, 0.5);
    outline-offset: 2px;
  }

  .topbar {
    position: sticky;
    top: 0;
    z-index: 20;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 1rem;
    padding: 0.85rem 1rem;
    min-height: var(--topbar-h);
    border-bottom: 1px solid var(--line);
    background: rgba(243, 239, 230, 0.88);
    backdrop-filter: blur(8px);
  }

  .brand {
    display: grid;
    gap: 0.1rem;
    line-height: 1.05;
  }
  .brand-title {
    font-family: var(--sans);
    font-weight: 680;
    font-size: 1.02rem;
    letter-spacing: 0.01em;
  }
  .brand-sub {
    font-family: var(--mono);
    font-size: 0.76rem;
    color: var(--ink-2);
    letter-spacing: 0.02em;
  }

  .top-actions {
    display: flex;
    align-items: center;
    justify-content: flex-end;
    flex-wrap: wrap;
    gap: 0.6rem;
  }
  .badges {
    display: flex;
    align-items: center;
    gap: 0.45rem;
  }
  .badge {
    height: 18px;
    width: auto;
    display: block;
    border-radius: 6px;
    box-shadow: 0 10px 26px rgba(12, 21, 32, 0.14);
  }

  .top-actions a {
    font-family: var(--mono);
    font-size: 0.82rem;
    text-decoration: none;
    color: var(--ink);
    border: 1px solid var(--line);
    padding: 0.4rem 0.55rem;
    border-radius: 12px;
    background: rgba(255, 255, 255, 0.18);
  }
  .top-actions a:hover {
    border-color: var(--line-2);
    transform: translateY(-1px);
  }

  .icon-btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 38px;
    height: 34px;
    padding: 0;
  }
  .icon {
    width: 18px;
    height: 18px;
    display: block;
  }

  .nav-toggle {
    display: none;
    border: 1px solid var(--line);
    background: rgba(255, 255, 255, 0.18);
    color: var(--ink);
    border-radius: 12px;
    padding: 0.45rem 0.55rem;
    font-family: var(--mono);
    font-size: 0.82rem;
  }
  .nav-toggle:focus-visible {
    outline: 2px solid rgba(42, 167, 161, 0.55);
    outline-offset: 2px;
  }

  .layout {
    display: grid;
    grid-template-columns: 290px minmax(0, 1fr);
    gap: 1.25rem;
    align-items: start;
    max-width: 1440px;
    margin: 0 auto;
    padding: 1.25rem 1.25rem 3rem;
  }

  .sidebar {
    position: sticky;
    top: var(--topbar-h);
    align-self: start;
    border: 1px solid var(--line);
    border-radius: 18px;
    background: rgba(255, 255, 255, 0.22);
    box-shadow: var(--shadow);
    overflow: clip;
  }

  .sidebar-inner {
    padding: 0.95rem 0.95rem 0.85rem;
    display: grid;
    gap: 0.75rem;
  }

  .searchbox {
    display: grid;
    gap: 0.4rem;
  }
  .searchbox label {
    font-family: var(--mono);
    font-size: 0.72rem;
    text-transform: uppercase;
    letter-spacing: 0.12em;
    color: var(--ink-2);
  }
  .searchbox input {
    width: 100%;
    border: 1px solid var(--line);
    border-radius: 14px;
    padding: 0.55rem 0.65rem;
    background: rgba(243, 239, 230, 0.85);
    color: var(--ink);
    font-family: var(--mono);
    font-size: 0.88rem;
  }
  .searchbox input:focus-visible {
    outline: 2px solid rgba(255, 90, 47, 0.45);
    outline-offset: 2px;
  }

  .side-nav {
    display: grid;
    gap: 0.65rem;
  }
  .nav-section-title {
    font-family: var(--mono);
    font-size: 0.72rem;
    text-transform: uppercase;
    letter-spacing: 0.12em;
    color: var(--ink-2);
    margin: 0.35rem 0 0.2rem;
  }
  .side-nav a {
    display: flex;
    align-items: baseline;
    justify-content: space-between;
    gap: 0.75rem;
    text-decoration: none;
    color: var(--ink);
    border: 1px solid transparent;
    border-radius: 14px;
    padding: 0.55rem 0.6rem;
    background: rgba(255, 255, 255, 0.14);
    transition: transform 120ms ease, border-color 120ms ease, background 120ms ease;
  }
  .side-nav a .nav-label {
    font-family: var(--sans);
    font-weight: 620;
  }
  .side-nav a .nav-meta {
    font-family: var(--mono);
    font-size: 0.72rem;
    letter-spacing: 0.06em;
    color: var(--ink-3);
  }
  .side-nav a:hover {
    border-color: var(--line);
    transform: translateY(-1px);
  }
  .side-nav a.active {
    border-color: rgba(255, 90, 47, 0.5);
    background: linear-gradient(135deg, rgba(255, 90, 47, 0.16), rgba(42, 167, 161, 0.12));
  }

  .docs-main {
    padding: 0;
    min-width: 0;
    align-self: start;
  }
  .page-title {
    margin: 0 0 0.35rem;
    font-size: 2.05rem;
    font-weight: 720;
    letter-spacing: 0.01em;
  }
  .page-subtitle {
    margin: 0 0 1.25rem;
    color: var(--ink-2);
    max-width: 78ch;
  }

  .page-head {
    margin: 0 0 1.1rem;
    padding: 1.1rem 1.15rem;
    border: 1px solid var(--line);
    border-radius: 18px;
    background: rgba(255, 255, 255, 0.22);
    box-shadow: var(--shadow);
  }

  .console-actions {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
    margin-top: 0.85rem;
  }

  .btn {
    border: 1px solid var(--line);
    background: rgba(243, 239, 230, 0.88);
    color: var(--ink);
    border-radius: 14px;
    padding: 0.5rem 0.65rem;
    font-family: var(--mono);
    font-size: 0.82rem;
    letter-spacing: 0.02em;
    cursor: pointer;
  }
  .btn:hover {
    border-color: var(--line-2);
    transform: translateY(-1px);
  }
  .btn:focus-visible {
    outline: 2px solid rgba(42, 167, 161, 0.55);
    outline-offset: 2px;
  }
  .btn-ghost {
    background: transparent;
  }
  .index-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
    gap: 1rem;
  }
  .demo-card {
    background: rgba(255, 255, 255, 0.22);
    border: 1px solid var(--line);
    border-radius: 18px;
    padding: 0.9rem;
    box-shadow: var(--shadow);
  }
  .demo-card h3 {
    margin: 0 0 0.35rem;
    font-size: 0.78rem;
    font-family: var(--mono);
    text-transform: uppercase;
    letter-spacing: 0.08em;
    color: var(--ink-2);
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
    background: rgba(255, 255, 255, 0.22);
    border: 1px solid var(--line);
    border-radius: 18px;
    padding: 1rem;
    box-shadow: var(--shadow);
  }
  .gauge-panel {
    display: grid;
    gap: 0.75rem;
    justify-items: center;
  }
  .control-panel {
    align-self: start;
  }
  .control-grid {
    display: grid;
    gap: 0.4rem;
  }
  .control-item {
    border: 1px solid rgba(12, 21, 32, 0.16);
    border-radius: 14px;
    padding: 0.55rem 0.45rem;
    background: rgba(243, 239, 230, 0.72);
  }
  .control-item label {
    display: block;
    font-weight: 700;
    color: var(--ink);
    margin-bottom: 0.2rem;
  }
  .control-item p {
    margin: 0.2rem 0 0.45rem;
    font-size: 0.8rem;
    color: var(--ink-2);
  }
  .control-item input,
  .control-item select {
    width: 100%;
    box-sizing: border-box;
    border: 1px solid var(--line-2);
    border-radius: 12px;
    padding: 0.35rem 0.45rem;
    font: inherit;
    color: var(--ink);
    background: rgba(255, 255, 255, 0.5);
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
    border-top: 1px dashed var(--line);
    padding-top: 0.8rem;
  }
  .setting-reference h4 {
    margin: 0 0 0.45rem;
    font-size: 0.86rem;
    text-transform: uppercase;
    letter-spacing: 0.07em;
    color: var(--ink-2);
  }
  .setting-reference ul {
    margin: 0;
    padding-left: 1rem;
    display: grid;
    gap: 0.35rem;
  }
  .setting-reference li {
    font-size: 0.82rem;
    color: var(--ink-2);
  }
  .state-preview {
    margin: 0;
    width: 100%;
    background: rgba(12, 21, 32, 0.92);
    color: rgba(243, 239, 230, 0.92);
    border-radius: 14px;
    padding: 0.7rem;
    font-size: 0.72rem;
    overflow: auto;
    font-family: var(--mono);
  }

  .state-wrap {
    width: 100%;
    position: relative;
  }
  .state-copy {
    position: absolute;
    top: 0.55rem;
    right: 0.55rem;
    border: 1px solid rgba(243, 239, 230, 0.28);
    background: rgba(12, 21, 32, 0.22);
    color: rgba(243, 239, 230, 0.92);
    border-radius: 12px;
    padding: 0.35rem;
    cursor: pointer;
    opacity: 0.72;
    transition: opacity 120ms ease, transform 120ms ease, border-color 120ms ease;
  }
  .state-copy:hover {
    opacity: 1;
    transform: translateY(-1px);
    border-color: rgba(243, 239, 230, 0.44);
  }
  .state-copy:focus-visible {
    outline: 2px solid rgba(42, 167, 161, 0.55);
    outline-offset: 2px;
    opacity: 1;
  }

  .doc-hero {
    padding: 1.35rem 1.25rem;
    border: 1px solid var(--line);
    border-radius: 18px;
    background: rgba(255, 255, 255, 0.22);
    box-shadow: var(--shadow);
    margin-bottom: 1rem;
  }
  .doc-eyebrow {
    margin: 0 0 0.35rem;
    font-family: var(--mono);
    letter-spacing: 0.18em;
    text-transform: uppercase;
    font-size: 0.72rem;
    color: var(--ink-2);
  }
  .doc-title {
    margin: 0 0 0.4rem;
    font-size: 2.25rem;
    font-weight: 820;
    letter-spacing: -0.01em;
  }
  .doc-lede {
    margin: 0;
    max-width: 78ch;
    color: var(--ink-2);
    font-size: 1.02rem;
  }
  .doc-section {
    margin: 1rem 0;
    padding: 1rem 1.15rem;
    border: 1px solid var(--line);
    border-radius: 18px;
    background: rgba(255, 255, 255, 0.18);
    box-shadow: var(--shadow);
  }
  .doc-h2 {
    margin: 0 0 0.55rem;
    font-size: 1.25rem;
    font-weight: 740;
  }
  .doc-p {
    margin: 0.55rem 0;
    color: var(--ink-2);
    max-width: 86ch;
  }
  .doc-link {
    color: var(--ink);
    text-decoration: underline;
    text-decoration-color: rgba(255, 90, 47, 0.55);
    text-decoration-thickness: 2px;
    text-underline-offset: 3px;
  }
  .inline-code {
    font-family: var(--mono);
    font-size: 0.92em;
  }
  .code {
    margin: 0.65rem 0;
    border: 1px solid rgba(12, 21, 32, 0.2);
    background: rgba(12, 21, 32, 0.92);
    color: rgba(243, 239, 230, 0.92);
    border-radius: 16px;
    padding: 0.85rem;
    overflow: auto;
    font-family: var(--mono);
    font-size: 0.84rem;
  }
  .callout {
    border: 1px solid rgba(255, 90, 47, 0.4);
    border-radius: 16px;
    padding: 0.8rem 0.9rem;
    background: linear-gradient(135deg, rgba(255, 90, 47, 0.14), rgba(42, 167, 161, 0.10));
    color: var(--ink);
    margin: 0.75rem 0;
    font-family: var(--mono);
    font-size: 0.84rem;
  }

  .toast-host {
    position: fixed;
    right: 1rem;
    bottom: 1rem;
    z-index: 60;
    display: grid;
    gap: 0.5rem;
    max-width: min(420px, calc(100vw - 2rem));
  }
  .toast {
    border: 1px solid var(--line);
    border-radius: 16px;
    padding: 0.7rem 0.8rem;
    background: rgba(243, 239, 230, 0.94);
    box-shadow: var(--shadow);
    font-family: var(--mono);
    font-size: 0.82rem;
    animation: toast-in 220ms ease-out;
  }
  .toast-warning {
    border-color: rgba(255, 90, 47, 0.45);
  }
  .toast-out {
    opacity: 0;
    transform: translateY(6px);
    transition: opacity 280ms ease, transform 280ms ease;
  }
  @keyframes toast-in {
    from {
      opacity: 0;
      transform: translateY(8px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  @media (max-width: 980px) {
    .badges {
      display: none;
    }
    .layout {
      grid-template-columns: 1fr;
      padding: 1rem 1rem 3rem;
    }
    .sidebar {
      position: fixed;
      inset: calc(var(--topbar-h) - 0.1rem) 0 auto 0;
      top: calc(var(--topbar-h) - 0.1rem);
      left: 0.75rem;
      right: 0.75rem;
      max-height: calc(100vh - 5.4rem);
      overflow: auto;
      transform: translateY(-8px);
      opacity: 0;
      pointer-events: none;
      transition: opacity 160ms ease, transform 160ms ease;
      z-index: 30;
    }
    .docs-shell[data-sidebar='open'] .sidebar {
      opacity: 1;
      pointer-events: auto;
      transform: translateY(0);
    }
    .nav-toggle {
      display: inline-flex;
      align-items: center;
      justify-content: center;
    }
    .page-layout {
      grid-template-columns: 1fr;
    }
  }

  @media (min-width: 981px) {
    .gauge-panel {
      position: sticky;
      top: calc(var(--topbar-h) + 1.25rem);
    }
  }
`

export const currentRoute = (): Route => {
  const path = window.location.pathname
  if (
    path === '/start-here' ||
    path === '/concepts' ||
    path === '/theming' ||
    path === '/integrations' ||
    path === '/troubleshooting' ||
    path === '/radial' ||
    path === '/radial-bargraph' ||
    path === '/compass' ||
    path === '/wind-direction' ||
    path === '/wind-rose'
  ) {
    return path
  }

  return '/'
}

export const renderShell = (route: Route): string => {
  const section = (
    title: string,
    links: Array<{ path: Route; label: string; meta: string; keywords: string }>
  ): string => {
    const items = links
      .map((link) => {
        const active = route === link.path ? 'active' : ''
        return `<a href="${link.path}" data-nav="true" data-title="${link.label}" data-keywords="${link.keywords}" class="${active}"><span class="nav-label">${link.label}</span><span class="nav-meta">${link.meta}</span></a>`
      })
      .join('')
    return `<div class="nav-section"><div class="nav-section-title">${title}</div>${items}</div>`
  }

  return `
    <style>${rootStyles}</style>
    <div class="docs-shell" data-sidebar="closed">
      <a class="skip-link" href="#page-root">Skip to content</a>
      <header class="topbar">
        <button class="nav-toggle" type="button" data-shell-toggle="sidebar" aria-controls="sidebar" aria-expanded="false">Menu</button>
        <div class="brand" aria-label="Weather Gauges">
          <div class="brand-title">Weather Gauges</div>
          <div class="brand-sub">field manual + instrument lab</div>
        </div>
        <div class="top-actions">
          <div class="badges" aria-label="Project badges">
            <img class="badge" alt="Status: beta" src="https://img.shields.io/badge/status-beta-yellow" loading="lazy" />
            <img class="badge" alt="TypeScript 5.9" src="https://img.shields.io/badge/TypeScript-5.9-blue" loading="lazy" />
            <img class="badge" alt="License: MIT" src="https://img.shields.io/badge/license-MIT-green" loading="lazy" />
          </div>
          <a class="icon-btn" href="https://github.com/bradsjm/weather-gauges" target="_blank" rel="noreferrer" aria-label="GitHub repository">
            <svg class="icon" viewBox="0 0 24 24" aria-hidden="true">
              <path fill="currentColor" d="M12 .5C5.73.5.75 5.7.75 12.3c0 5.29 3.44 9.78 8.2 11.37.6.12.82-.27.82-.58 0-.29-.01-1.05-.02-2.07-3.34.75-4.04-1.67-4.04-1.67-.54-1.42-1.33-1.8-1.33-1.8-1.09-.77.08-.75.08-.75 1.2.09 1.84 1.28 1.84 1.28 1.07 1.9 2.8 1.35 3.48 1.03.11-.8.41-1.35.75-1.66-2.66-.32-5.46-1.38-5.46-6.13 0-1.36.46-2.47 1.23-3.35-.12-.32-.53-1.6.12-3.33 0 0 1-.33 3.3 1.28.96-.28 1.98-.41 3-.42 1.02.01 2.05.14 3 .42 2.3-1.61 3.3-1.28 3.3-1.28.65 1.73.24 3.01.12 3.33.77.88 1.23 1.99 1.23 3.35 0 4.76-2.8 5.81-5.47 6.12.42.38.8 1.13.8 2.29 0 1.66-.02 3-.02 3.41 0 .32.22.71.83.58 4.76-1.59 8.2-6.08 8.2-11.37C23.25 5.7 18.27.5 12 .5z"/>
            </svg>
          </a>
        </div>
      </header>
      <div class="layout">
        <aside class="sidebar" id="sidebar">
          <div class="sidebar-inner">
            <div class="searchbox">
              <label for="doc-search">Search</label>
              <input id="doc-search" type="search" placeholder="Find a page..." autocomplete="off" spellcheck="false" />
            </div>
            <nav class="side-nav" aria-label="Docs navigation">
              ${section('Getting Started', [
                {
                  path: '/',
                  label: 'Index',
                  meta: 'overview',
                  keywords: 'overview gallery playground'
                },
                {
                  path: '/start-here',
                  label: 'Start Here',
                  meta: '3 min',
                  keywords: 'install quickstart web components'
                },
                {
                  path: '/concepts',
                  label: 'Concepts',
                  meta: 'map',
                  keywords: 'presets scale alerts attributes properties'
                }
              ])}
              ${section('Materials', [
                {
                  path: '/theming',
                  label: 'Theming',
                  meta: 'tokens',
                  keywords: 'css variables materials frame dial glass'
                }
              ])}
              ${section('Integrations', [
                {
                  path: '/integrations',
                  label: 'Integrations',
                  meta: 'deploy',
                  keywords: 'vanilla home assistant ha cards static hosting'
                }
              ])}
              ${section('Playgrounds', [
                {
                  path: '/radial',
                  label: 'Radial',
                  meta: 'scalar',
                  keywords: 'wx-gauge value min max threshold'
                },
                {
                  path: '/radial-bargraph',
                  label: 'Radial Bargraph',
                  meta: 'scalar',
                  keywords: 'wx-bargraph trend led threshold'
                },
                {
                  path: '/compass',
                  label: 'Compass',
                  meta: 'heading',
                  keywords: 'wx-compass heading degrees'
                },
                {
                  path: '/wind-direction',
                  label: 'Wind Direction',
                  meta: 'latest/avg',
                  keywords: 'wx-wind-direction average'
                },
                {
                  path: '/wind-rose',
                  label: 'Wind Rose',
                  meta: 'petals',
                  keywords: 'wx-wind-rose petals distribution bins'
                }
              ])}
              ${section('Reference', [
                {
                  path: '/troubleshooting',
                  label: 'Troubleshooting',
                  meta: 'checklist',
                  keywords: '404 routing rewrite attribute property performance'
                }
              ])}
            </nav>
          </div>
        </aside>
        <main class="docs-main" id="page-root" tabindex="-1"></main>
      </div>
      <div class="toast-host" id="toast-host" aria-live="polite"></div>
    </div>
  `
}
