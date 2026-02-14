export const renderConceptsPage = (root: HTMLElement): void => {
  root.innerHTML = `
    <header class="doc-hero">
      <p class="doc-eyebrow">Field Manual</p>
      <h1 class="doc-title">Concepts</h1>
      <p class="doc-lede">A quick map of the terrain: presets, scale, alerts, and why things are named the way they are.</p>
    </header>

    <section class="doc-section">
      <h2 class="doc-h2">Presets</h2>
      <p class="doc-p">
        Presets are shorthand for common weather measurements (temperature, humidity, pressure, etc.).
        They usually set scale, units, labels, and common thresholds.
      </p>
      <p class="doc-p">Try one in the <a class="doc-link" href="/radial" data-nav="true">Radial playground</a>.</p>
    </section>

    <section class="doc-section">
      <h2 class="doc-h2">Scale (Min/Max)</h2>
      <p class="doc-p">Scalar gauges read best when the scale matches the story you want to tell.</p>
      <div class="callout">
        <strong>Rule of thumb:</strong> choose scale first, then choose warning/critical thresholds.
      </div>
    </section>

    <section class="doc-section">
      <h2 class="doc-h2">Alerts, Sections, Petals</h2>
      <p class="doc-p">
        Sections and alerts let the gauge explain meaning (safe/notice/danger). Wind rose petals are a
        distribution across headings.
      </p>
      <p class="doc-p">Explore petals in <a class="doc-link" href="/wind-rose" data-nav="true">Wind Rose</a>.</p>
    </section>

    <section class="doc-section">
      <h2 class="doc-h2">Attributes vs Properties</h2>
      <p class="doc-p">
        Attributes are strings in HTML. Properties are typed values in JS.
        If a value looks "ignored", it is often a parsing/type issue.
      </p>
      <p class="doc-p">If you get stuck, jump to <a class="doc-link" href="/troubleshooting" data-nav="true">Troubleshooting</a>.</p>
    </section>
  `
}
