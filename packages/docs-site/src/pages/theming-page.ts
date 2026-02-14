export const renderThemingPage = (root: HTMLElement): void => {
  root.innerHTML = `
    <header class="doc-hero">
      <p class="doc-eyebrow">Materials</p>
      <h1 class="doc-title">Theming</h1>
      <p class="doc-lede">
        Frames, dials, glass, pointers: you are not just picking colors, you are selecting materials.
      </p>
    </header>

    <section class="doc-section">
      <h2 class="doc-h2">CSS Tokens</h2>
      <p class="doc-p">Use CSS custom properties to integrate gauges into your product palette.</p>
      <pre class="code"><code>:root {
  --wx-text: #0c1520;
  --wx-accent: #ff5a2f;
  --wx-frame: #101820;
  --wx-background: #f2efe8;
}</code></pre>
      <p class="doc-p">Then set the gauge style via properties/attributes (or per-container CSS as supported).</p>
    </section>

    <section class="doc-section">
      <h2 class="doc-h2">Design Advice</h2>
      <div class="callout">
        <strong>Commit to a material story:</strong> brushed metal + fogged glass + warning LEDs reads very differently than flat ink + paper.
      </div>
      <p class="doc-p">Use the playground controls for frame/background/foreground to explore combinations quickly.</p>
    </section>
  `
}
