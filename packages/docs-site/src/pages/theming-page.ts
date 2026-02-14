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
      <h2 class="doc-h2">CSS Custom Properties</h2>
      <p class="doc-p">
        Use CSS custom properties to integrate gauges into your product palette. These tokens cascade to all gauge
        instances:
      </p>
      <table class="doc-table">
        <thead><tr><th>Token</th><th>Default</th><th>Description</th></tr></thead>
        <tbody>
          <tr><td><code class="inline-code">--wx-text</code></td><td>#0c1520</td><td>Primary text color</td></tr>
          <tr><td><code class="inline-code">--wx-accent</code></td><td>#ff5a2f</td><td>Accent/highlight color</td></tr>
          <tr><td><code class="inline-code">--wx-frame</code></td><td>#101820</td><td>Frame border color</td></tr>
          <tr><td><code class="inline-code">--wx-background</code></td><td>#f2efe8</td><td>Background color</td></tr>
        </tbody>
      </table>
      <pre class="code"><code>:root {
  --wx-text: #0c1520;
  --wx-accent: #ff5a2f;
  --wx-frame: #101820;
  --wx-background: #f2efe8;
}</code></pre>
    </section>

    <section class="doc-section">
      <h2 class="doc-h2">Material Presets</h2>
      <p class="doc-p">
        Each gauge component supports material-based customization. These work together to create cohesive visual
        styles.
      </p>

      <h3 class="doc-h3">Frame Designs</h3>
      <p class="doc-p">The outer bezel style. Options include:</p>
      <ul class="doc-list">
        <li><strong>Metals</strong>: metal, shinyMetal, brass, steel, chrome, gold</li>
        <li><strong>Dark</strong>: blackMetal, anthracite, tiltedBlack</li>
        <li><strong>Special</strong>: tiltedGray, glossyMetal</li>
      </ul>

      <h3 class="doc-h3">Background Colors</h3>
      <p class="doc-p">Dial background materials. Options include:</p>
      <ul class="doc-list">
        <li><strong>Grays</strong>: dark-gray, satin-gray, light-gray</li>
        <li><strong>Colors</strong>: beige, brown, red, green, blue</li>
        <li><strong>Textures</strong>: carbon, stainless, brushed-metal, punched-sheet</li>
      </ul>

      <h3 class="doc-h3">Foreground (Glass)</h3>
      <p class="doc-p">Glass overlay effects:</p>
      <ul class="doc-list">
        <li><code class="inline-code">top-arc-glass</code>: Subtle gradient at top of arc</li>
        <li><code class="inline-code">side-reflection-glass</code>: Horizontal reflection lines</li>
        <li><code class="inline-code">dome-glass</code>: Dome-shaped gradient overlay</li>
        <li><code class="inline-code">center-glow-glass</code>: Radial glow from center</li>
        <li><code class="inline-code">sweep-glass</code>: Sweeping gradient effect</li>
      </ul>
    </section>

    <section class="doc-section">
      <h2 class="doc-h2">Design Advice</h2>
      <div class="callout">
        <strong>Commit to a material story:</strong> Brushed metal + fogged glass + warning LEDs reads very differently
        than flat ink + paper.
      </div>
      <p class="doc-p">
        Use the playground controls for frame, background, and foreground to explore combinations quickly. The
        <a class="doc-link" href="/" data-nav="true">Index</a> page shows curated examples for different weather measurements.
      </p>
    </section>

    <section class="doc-section">
      <h2 class="doc-h2">Component Theming</h2>
      <p class="doc-p">
        Individual components can be themed by setting attributes or properties. The priority order is:
      </p>
      <ol class="doc-list">
        <li>Property value (JavaScript)</li>
        <li>Attribute value (HTML)</li>
        <li>Preset defaults</li>
        <li>Global CSS defaults</li>
      </ol>
      <pre class="code"><code>&lt;wx-gauge
  frame-design="brass"
  background-color="beige"
  foreground-type="dome-glass"
&gt;&lt;/wx-gauge&gt;</code></pre>
    </section>
  `
}
