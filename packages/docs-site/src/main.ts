import '@bradsjm/steelseries-v3-elements'

const app = document.querySelector<HTMLDivElement>('#app')
const searchParams = new URLSearchParams(window.location.search)

if (app) {
  if (searchParams.get('view') === 'visual') {
    const kind = searchParams.get('kind') ?? 'radial-bargraph'
    const id = searchParams.get('id') ?? 'reference'
    const value = Number(searchParams.get('value') ?? '50')
    const heading = Number(searchParams.get('heading') ?? '90')
    const min = Number(searchParams.get('min') ?? '0')
    const max = Number(searchParams.get('max') ?? '100')
    const threshold = Number(searchParams.get('threshold') ?? '80')
    const title = searchParams.get('title') ?? 'Gauge'
    const unit = searchParams.get('unit') ?? ''
    const label = searchParams.get('label') ?? id
    const size = Number(searchParams.get('size') ?? '220')

    const radialBargraphAttributeString = [
      searchParams.get('frameDesign')
        ? `frame-design="${searchParams.get('frameDesign')}"`
        : undefined,
      searchParams.get('radialBackgroundColor')
        ? `background-color="${searchParams.get('radialBackgroundColor')}"`
        : undefined,
      searchParams.get('radialBargraphForegroundType')
        ? `foreground-type="${searchParams.get('radialBargraphForegroundType')}"`
        : undefined,
      searchParams.get('radialGaugeType')
        ? `gauge-type="${searchParams.get('radialGaugeType')}"`
        : undefined,
      searchParams.get('radialBargraphValueColor')
        ? `value-color="${searchParams.get('radialBargraphValueColor')}"`
        : undefined,
      searchParams.get('radialBargraphLcdColor')
        ? `lcd-color="${searchParams.get('radialBargraphLcdColor')}"`
        : undefined,
      searchParams.get('tickLabelOrientation')
        ? `tick-label-orientation="${searchParams.get('tickLabelOrientation')}"`
        : undefined,
      searchParams.get('labelNumberFormat')
        ? `label-number-format="${searchParams.get('labelNumberFormat')}"`
        : undefined,
      searchParams.get('useSectionColors')
        ? `use-section-colors="${searchParams.get('useSectionColors')}"`
        : undefined,
      searchParams.get('useValueGradient')
        ? `use-value-gradient="${searchParams.get('useValueGradient')}"`
        : undefined,
      searchParams.get('showLcd') ? `show-lcd="${searchParams.get('showLcd')}"` : undefined,
      searchParams.get('digitalFont')
        ? `digital-font="${searchParams.get('digitalFont')}"`
        : undefined,
      searchParams.get('ledVisible')
        ? `led-visible="${searchParams.get('ledVisible')}"`
        : undefined,
      searchParams.get('userLedVisible')
        ? `user-led-visible="${searchParams.get('userLedVisible')}"`
        : undefined,
      searchParams.get('trendVisible')
        ? `trend-visible="${searchParams.get('trendVisible')}"`
        : undefined,
      searchParams.get('trendState') ? `trend-state="${searchParams.get('trendState')}"` : undefined
    ]
      .filter((value): value is string => value !== undefined)
      .join(' ')

    const compassAttributeString = [
      searchParams.get('frameDesign')
        ? `frame-design="${searchParams.get('frameDesign')}"`
        : undefined,
      searchParams.get('compassBackgroundColor')
        ? `background-color="${searchParams.get('compassBackgroundColor')}"`
        : undefined,
      searchParams.get('pointerType')
        ? `pointer-type="${searchParams.get('pointerType')}"`
        : undefined,
      searchParams.get('pointerColor')
        ? `pointer-color="${searchParams.get('pointerColor')}"`
        : undefined,
      searchParams.get('knobType') ? `knob-type="${searchParams.get('knobType')}"` : undefined,
      searchParams.get('knobStyle') ? `knob-style="${searchParams.get('knobStyle')}"` : undefined,
      searchParams.get('foregroundType')
        ? `foreground-type="${searchParams.get('foregroundType')}"`
        : undefined,
      searchParams.get('degreeScale')
        ? `degree-scale="${searchParams.get('degreeScale')}"`
        : undefined,
      searchParams.get('roseVisible')
        ? `rose-visible="${searchParams.get('roseVisible')}"`
        : undefined,
      searchParams.get('rotateFace')
        ? `rotate-face="${searchParams.get('rotateFace')}"`
        : undefined,
      searchParams.get('pointSymbolsVisible')
        ? `point-symbols-visible="${searchParams.get('pointSymbolsVisible')}"`
        : undefined,
      searchParams.get('pointSymbolN')
        ? `point-symbol-n="${searchParams.get('pointSymbolN')}"`
        : undefined,
      searchParams.get('pointSymbolNE')
        ? `point-symbol-ne="${searchParams.get('pointSymbolNE')}"`
        : undefined,
      searchParams.get('pointSymbolE')
        ? `point-symbol-e="${searchParams.get('pointSymbolE')}"`
        : undefined,
      searchParams.get('pointSymbolSE')
        ? `point-symbol-se="${searchParams.get('pointSymbolSE')}"`
        : undefined,
      searchParams.get('pointSymbolS')
        ? `point-symbol-s="${searchParams.get('pointSymbolS')}"`
        : undefined,
      searchParams.get('pointSymbolSW')
        ? `point-symbol-sw="${searchParams.get('pointSymbolSW')}"`
        : undefined,
      searchParams.get('pointSymbolW')
        ? `point-symbol-w="${searchParams.get('pointSymbolW')}"`
        : undefined,
      searchParams.get('pointSymbolNW')
        ? `point-symbol-nw="${searchParams.get('pointSymbolNW')}"`
        : undefined
    ]
      .filter((value): value is string => value !== undefined)
      .join(' ')

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

    const fixtureTag =
      kind === 'compass'
        ? `<steelseries-compass-v3
            title="${title}"
            unit="${unit}"
            heading="${heading}"
            size="${size}"
            animate-value="false"
            ${compassAttributeString}
            style="${tokenStyle}"
          ></steelseries-compass-v3>`
        : `<steelseries-radial-bargraph-v3
            title="${title}"
            unit="${unit}"
            value="${value}"
            min-value="${min}"
            max-value="${max}"
            threshold="${threshold}"
            size="${size}"
            animate-value="false"
            ${radialBargraphAttributeString}
            style="${tokenStyle}"
          ></steelseries-radial-bargraph-v3>`

    const testId = `${kind}-fixture`

    app.innerHTML = `
      <main style="font-family: 'Avenir Next', 'Segoe UI', sans-serif; padding: 24px; background: #f3f4f6; min-height: 100vh; box-sizing: border-box;">
        <section data-testid="${testId}" style="width: 320px; background: white; border-radius: 16px; padding: 16px; box-shadow: 0 10px 24px rgba(15, 23, 42, 0.14); display: grid; place-items: center;">
          <div style="font-size: 12px; letter-spacing: 0.08em; text-transform: uppercase; color: #334155; margin-bottom: 8px;">Fixture ${label}</div>
          ${fixtureTag}
        </section>
      </main>
    `
  } else {
    app.innerHTML = `
      <main style="font-family: 'Avenir Next', 'Segoe UI', sans-serif; padding: 1.25rem; max-width: 980px; margin: 0 auto;">
        <h1 style="margin: 0;">SteelSeries v3 Demos</h1>
        <p style="margin: 0.5rem 0 1rem; color: #334155;">Radial bargraph and compass demos with legacy parity options.</p>

        <section style="display: grid; grid-template-columns: repeat(auto-fit, minmax(260px, 1fr)); gap: 1rem; align-items: start;">
          <article style="padding: 1rem; border-radius: 14px; background: #f8fafc; border: 1px solid #e2e8f0;">
            <h2 style="margin: 0 0 0.5rem; font-size: 0.95rem; letter-spacing: 0.04em; text-transform: uppercase;">Radial Bargraph Reference</h2>
            <steelseries-radial-bargraph-v3 title="Pressure" unit="psi" value="75" threshold="80" size="220"></steelseries-radial-bargraph-v3>
          </article>

          <article style="padding: 1rem; border-radius: 14px; background: #f8fafc; border: 1px solid #e2e8f0;">
            <h2 style="margin: 0 0 0.5rem; font-size: 0.95rem; letter-spacing: 0.04em; text-transform: uppercase;">Radial Bargraph Type1</h2>
            <steelseries-radial-bargraph-v3
              title="Load"
              unit="%"
              value="42"
              threshold="70"
              size="240"
              gauge-type="type1"
              tick-label-orientation="tangent"
              animate-value="false"
            ></steelseries-radial-bargraph-v3>
          </article>

          <article style="padding: 1rem; border-radius: 14px; background: #f8fafc; border: 1px solid #e2e8f0;">
            <h2 style="margin: 0 0 0.5rem; font-size: 0.95rem; letter-spacing: 0.04em; text-transform: uppercase;">Radial Bargraph Gradient</h2>
            <steelseries-radial-bargraph-v3
              title="Temperature"
              unit="°C"
              value="76"
              threshold="85"
              size="240"
              frame-design="brass"
              background-color="BEIGE"
              gauge-type="type3"
              value-color="GREEN"
              foreground-type="type3"
              lcd-color="BLUE"
              use-value-gradient="true"
              digital-font="true"
              led-visible="true"
              trend-visible="true"
              trend-state="up"
              animate-value="false"
              style="
                --ss3-accent-color: #0f766e;
                --ss3-warning-color: #ca8a04;
                --ss3-danger-color: #dc2626;
              "
            ></steelseries-radial-bargraph-v3>
          </article>
        </section>

        <section style="margin-top: 1rem; display: grid; grid-template-columns: repeat(auto-fit, minmax(260px, 1fr)); gap: 1rem; align-items: start;">
          <article style="padding: 1rem; border-radius: 14px; background: #f8fafc; border: 1px solid #e2e8f0;">
            <h2 style="margin: 0 0 0.5rem; font-size: 0.95rem; letter-spacing: 0.04em; text-transform: uppercase;">Compass Default</h2>
            <steelseries-compass-v3 title="Heading" unit="deg" heading="92" size="240" animate-value="false"></steelseries-compass-v3>
          </article>

          <article style="padding: 1rem; border-radius: 14px; background: #f8fafc; border: 1px solid #e2e8f0;">
            <h2 style="margin: 0 0 0.5rem; font-size: 0.95rem; letter-spacing: 0.04em; text-transform: uppercase;">Compass Legacy Styles</h2>
            <steelseries-compass-v3
              title="Marine"
              unit="deg"
              heading="184"
              size="240"
              frame-design="brass"
              background-color="BEIGE"
              pointer-type="type1"
              pointer-color="BLUE"
              knob-type="metalKnob"
              knob-style="brass"
              foreground-type="type3"
              point-symbols-visible="true"
              degree-scale="false"
              animate-value="false"
            ></steelseries-compass-v3>
          </article>
        </section>

        <pre style="margin-top: 1rem; font-size: 0.8rem; background: #0b1120; color: #cbd5e1; padding: 0.75rem; border-radius: 10px; overflow: auto;">steelseries-radial-bargraph-v3 {
  --ss3-font-family: 'IBM Plex Sans', sans-serif;
  --ss3-background-color: #e0f2fe;
  --ss3-frame-color: #bae6fd;
  --ss3-text-color: #0c4a6e;
  --ss3-accent-color: #0f766e;
  --ss3-warning-color: #ca8a04;
  --ss3-danger-color: #dc2626;
}</pre>

        <section style="margin-top: 1rem; padding: 1rem; border-radius: 12px; background: #ffffff; border: 1px solid #e2e8f0;">
          <h2 style="margin: 0 0 0.5rem; font-size: 0.95rem; letter-spacing: 0.04em; text-transform: uppercase;">API</h2>
          <table style="width: 100%; border-collapse: collapse; font-size: 0.84rem;">
            <thead>
              <tr>
                <th style="text-align: left; padding: 0.35rem; border-bottom: 1px solid #cbd5e1;">Attribute</th>
                <th style="text-align: left; padding: 0.35rem; border-bottom: 1px solid #cbd5e1;">Description</th>
              </tr>
            </thead>
            <tbody>
              <tr><td style="padding: 0.35rem; border-bottom: 1px solid #e2e8f0;">value</td><td style="padding: 0.35rem; border-bottom: 1px solid #e2e8f0;">Current gauge value</td></tr>
              <tr><td style="padding: 0.35rem; border-bottom: 1px solid #e2e8f0;">min-value / max-value</td><td style="padding: 0.35rem; border-bottom: 1px solid #e2e8f0;">Scale range bounds</td></tr>
              <tr><td style="padding: 0.35rem; border-bottom: 1px solid #e2e8f0;">threshold</td><td style="padding: 0.35rem; border-bottom: 1px solid #e2e8f0;">Warning marker value</td></tr>
              <tr><td style="padding: 0.35rem; border-bottom: 1px solid #e2e8f0;">title / unit</td><td style="padding: 0.35rem; border-bottom: 1px solid #e2e8f0;">Label metadata</td></tr>
              <tr><td style="padding: 0.35rem;">animate-value</td><td style="padding: 0.35rem;">Enable/disable value transition animation</td></tr>
            </tbody>
          </table>
          <p style="margin: 0.75rem 0 0; color: #475569; font-size: 0.8rem;">Caveat: use <code>animate-value="false"</code> for deterministic screenshot capture in visual CI.</p>
        </section>
      </main>
    `
  }
}
