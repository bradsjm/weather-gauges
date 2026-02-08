import '@bradsjm/steelseries-v3-elements'

const app = document.querySelector<HTMLDivElement>('#app')
const searchParams = new URLSearchParams(window.location.search)

if (app) {
  if (searchParams.get('view') === 'visual') {
    const id = searchParams.get('id') ?? 'baseline-mid'
    const value = Number(searchParams.get('value') ?? '50')
    const min = Number(searchParams.get('min') ?? '0')
    const max = Number(searchParams.get('max') ?? '100')
    const threshold = Number(searchParams.get('threshold') ?? '80')
    const title = searchParams.get('title') ?? 'Radial'
    const unit = searchParams.get('unit') ?? ''
    const label = searchParams.get('label') ?? id

    const tokenStyle = [
      searchParams.get('fontFamily')
        ? `--ss3-font-family:${searchParams.get('fontFamily')};`
        : undefined,
      searchParams.get('textColor')
        ? `--ss3-text-color:${searchParams.get('textColor')};`
        : undefined,
      searchParams.get('backgroundColor')
        ? `--ss3-background-color:${searchParams.get('backgroundColor')};`
        : undefined,
      searchParams.get('frameColor')
        ? `--ss3-frame-color:${searchParams.get('frameColor')};`
        : undefined,
      searchParams.get('accentColor')
        ? `--ss3-accent-color:${searchParams.get('accentColor')};`
        : undefined,
      searchParams.get('warningColor')
        ? `--ss3-warning-color:${searchParams.get('warningColor')};`
        : undefined,
      searchParams.get('dangerColor')
        ? `--ss3-danger-color:${searchParams.get('dangerColor')};`
        : undefined
    ]
      .filter((value): value is string => value !== undefined)
      .join(' ')

    app.innerHTML = `
      <main style="font-family: 'Avenir Next', 'Segoe UI', sans-serif; padding: 24px; background: #f3f4f6; min-height: 100vh; box-sizing: border-box;">
        <section data-testid="radial-fixture" style="width: 240px; background: white; border-radius: 16px; padding: 16px; box-shadow: 0 10px 24px rgba(15, 23, 42, 0.14);">
          <div style="font-size: 12px; letter-spacing: 0.08em; text-transform: uppercase; color: #334155; margin-bottom: 8px;">Fixture ${label}</div>
          <steelseries-radial-v3
            title="${title}"
            unit="${unit}"
            value="${value}"
            min-value="${min}"
            max-value="${max}"
            threshold="${threshold}"
            animate-value="false"
            style="${tokenStyle}"
          ></steelseries-radial-v3>
        </section>
      </main>
    `
  } else {
    app.innerHTML = `
      <main style="font-family: 'Avenir Next', 'Segoe UI', sans-serif; padding: 1.25rem; max-width: 980px; margin: 0 auto;">
        <h1 style="margin: 0;">SteelSeries v3 Radial</h1>
        <p style="margin: 0.5rem 0 1rem; color: #334155;">Phase 2 radial demos with token override examples.</p>

        <section style="display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: 1rem; align-items: start;">
          <article style="padding: 1rem; border-radius: 14px; background: #f8fafc; border: 1px solid #e2e8f0;">
            <h2 style="margin: 0 0 0.5rem; font-size: 0.95rem; letter-spacing: 0.04em; text-transform: uppercase;">Minimal</h2>
            <steelseries-radial-v3 title="Pressure" unit="psi" value="42" threshold="80"></steelseries-radial-v3>
          </article>

          <article style="padding: 1rem; border-radius: 14px; background: #f8fafc; border: 1px solid #e2e8f0;">
            <h2 style="margin: 0 0 0.5rem; font-size: 0.95rem; letter-spacing: 0.04em; text-transform: uppercase;">Token Overrides</h2>
            <steelseries-radial-v3
              title="Temperature"
              unit="°F"
              value="88"
              threshold="72"
              style="
                --ss3-font-family: 'IBM Plex Sans', 'Avenir Next', sans-serif;
                --ss3-background-color: #e0f2fe;
                --ss3-frame-color: #bae6fd;
                --ss3-text-color: #0c4a6e;
                --ss3-accent-color: #0f766e;
                --ss3-warning-color: #ca8a04;
                --ss3-danger-color: #dc2626;
              "
            ></steelseries-radial-v3>
          </article>

          <article style="padding: 1rem; border-radius: 14px; background: #0f172a; border: 1px solid #1e293b; color: #e2e8f0;">
            <h2 style="margin: 0 0 0.5rem; font-size: 0.95rem; letter-spacing: 0.04em; text-transform: uppercase;">High Update</h2>
            <steelseries-radial-v3 id="demo-high-update" title="Load" unit="%" value="15" threshold="70" style="--ss3-text-color:#e2e8f0; --ss3-background-color:#1e293b; --ss3-frame-color:#334155;"></steelseries-radial-v3>
          </article>
        </section>

        <pre style="margin-top: 1rem; font-size: 0.8rem; background: #0b1120; color: #cbd5e1; padding: 0.75rem; border-radius: 10px; overflow: auto;">steelseries-radial-v3 {
  --ss3-font-family: 'IBM Plex Sans', sans-serif;
  --ss3-background-color: #e0f2fe;
  --ss3-frame-color: #bae6fd;
  --ss3-text-color: #0c4a6e;
  --ss3-accent-color: #0f766e;
  --ss3-warning-color: #ca8a04;
  --ss3-danger-color: #dc2626;
}</pre>
      </main>
    `

    const highUpdateGauge = app.querySelector<HTMLElement>('#demo-high-update')
    if (highUpdateGauge) {
      let current = 15
      let direction = 1

      window.setInterval(() => {
        current += direction * 5
        if (current >= 95) {
          direction = -1
        } else if (current <= 10) {
          direction = 1
        }

        highUpdateGauge.setAttribute('value', String(current))
      }, 350)
    }
  }
}
