export const renderTroubleshootingPage = (root: HTMLElement): void => {
  root.innerHTML = `
    <header class="doc-hero">
      <p class="doc-eyebrow">Checklist</p>
      <h1 class="doc-title">Troubleshooting</h1>
      <p class="doc-lede">The common culprits, in the order they usually happen.</p>
    </header>

    <section class="doc-section">
      <h2 class="doc-h2">Value Doesn't Update</h2>
      <p class="doc-p">
        The most common issue is using attributes when you need properties. In HTML, all attributes are strings.
      </p>
      <div class="callout">
        <strong>Use properties for numbers:</strong> <code class="inline-code">el.value = 42</code> is safer than attributes.
      </div>
      <pre class="code"><code>// Wrong - attribute sets string
const gauge = document.querySelector('wx-gauge')
gauge.setAttribute('value', '72')

// Correct - property sets typed value
gauge.value = 72

// In React/Vue, use refs or v-bind
gaugeRef.current.value = newValue</code></pre>
    </section>

    <section class="doc-section">
      <h2 class="doc-h2">Refresh Gives 404</h2>
      <p class="doc-p">
        If refreshing on a route like <code class="inline-code">/radial</code> gives a 404, your server needs SPA rewrites.
        Configure your host to serve <code class="inline-code">index.html</code> for all routes.
      </p>
      <p class="doc-p">See the <a class="doc-link" href="/integrations" data-nav="true">Integrations</a> page for specific configuration examples.</p>
    </section>

    <section class="doc-section">
      <h2 class="doc-h2">Performance Issues</h2>
      <p class="doc-p">
        If rendering feels rough, try these optimizations:
      </p>
      <ul class="doc-list">
        <li><strong>Reduce size</strong>: Smaller gauges render faster</li>
        <li><strong>Limit animations</strong>: Disable <code class="inline-code">animateValue</code> for rapidly updating data</li>
        <li><strong>Batch updates</strong>: Don't update every gauge in the same frame</li>
        <li><strong>Use presets</code>: Presets are pre-optimized</li>
      </ul>
    </section>

    <section class="doc-section">
      <h2 class="doc-h2">Gauge Doesn't Render</h2>
      <ul class="doc-list">
        <li>Check the browser console for errors</li>
        <li>Verify the element package is imported: <code class="inline-code">import '@bradsjm/weather-gauges-elements'</code></li>
        <li>Ensure core and elements packages are built</li>
        <li>Check the custom element tag name is correct (<code class="inline-code">wx-gauge</code>, <code class="inline-code">wx-compass</code>, etc.)</li>
      </ul>
    </section>

    <section class="doc-section">
      <h2 class="doc-h2">TypeScript Errors</h2>
      <p class="doc-p">
        If using TypeScript, you may need to declare the custom elements for JSX:
      </p>
      <pre class="code"><code>// src/custom-elements.d.ts
declare namespace JSX {
  interface IntrinsicElements {
    'wx-gauge': any
    'wx-bargraph': any
    'wx-compass': any
    'wx-wind-direction': any
    'wx-wind-rose': any
  }
}</code></pre>
    </section>

    <section class="doc-section">
      <h2 class="doc-h2">Common Attribute Gotchas</h2>
      <table class="doc-table">
        <thead><tr><th>Issue</th><th>Cause</th><th>Fix</th></tr></thead>
        <tbody>
          <tr><td>Value shows 0</td><td>Attribute is string "0"</td><td>Use property: el.value = 0</td></tr>
          <tr><td>Boolean ignored</td><td>Empty attribute is truthy</td><td>Use property: el.disabled = true</td></tr>
          <tr><td>Array ignored</td><td>Can't pass arrays in HTML</td><td>Use property: el.segments = [...]</td></tr>
        </tbody>
      </table>
    </section>
  `
}
