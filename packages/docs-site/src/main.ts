import '@bradsjm/steelseries-v3-elements'

const app = document.querySelector<HTMLDivElement>('#app')
const searchParams = new URLSearchParams(window.location.search)

if (app) {
  if (searchParams.get('view') === 'visual') {
    const id = searchParams.get('id') ?? 'baseline-mid'
    const value = Number(searchParams.get('value') ?? '50')
    const min = Number(searchParams.get('min') ?? '0')
    const max = Number(searchParams.get('max') ?? '100')
    const label = searchParams.get('label') ?? id

    app.innerHTML = `
      <main style="font-family: 'Avenir Next', 'Segoe UI', sans-serif; padding: 24px; background: #f3f4f6; min-height: 100vh; box-sizing: border-box;">
        <section data-testid="radial-fixture" style="width: 240px; background: white; border-radius: 16px; padding: 16px; box-shadow: 0 10px 24px rgba(15, 23, 42, 0.14);">
          <div style="font-size: 12px; letter-spacing: 0.08em; text-transform: uppercase; color: #334155; margin-bottom: 8px;">Fixture ${label}</div>
          <steelseries-radial-v3 value="${value}" data-min="${min}" data-max="${max}"></steelseries-radial-v3>
        </section>
      </main>
    `
  } else {
    app.innerHTML = `
      <main style="font-family: 'Avenir Next', 'Segoe UI', sans-serif; padding: 1rem;">
        <h1>SteelSeries v3 Docs Scaffold</h1>
        <p>Phase 0 docs and playground placeholder.</p>
        <steelseries-radial-v3 value="42"></steelseries-radial-v3>
      </main>
    `
  }
}
