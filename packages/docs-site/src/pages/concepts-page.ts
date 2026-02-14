export const renderConceptsPage = (root: HTMLElement): void => {
  root.innerHTML = `
    <header class="doc-hero">
      <p class="doc-eyebrow">Field Manual</p>
      <h1 class="doc-title">Concepts</h1>
      <p class="doc-lede">A map of the terrain: presets, scale, alerts, and how the pieces fit together.</p>
    </header>

    <section class="doc-section">
      <h2 class="doc-h2">Presets</h2>
      <p class="doc-p">
        Presets are shorthand for common weather measurements. Each preset configures scale, units, labels,
        tick marks, and threshold defaults for a specific measurement type.
      </p>
      <table class="doc-table">
        <thead><tr><th>Preset</th><th>Unit</th><th>Typical Range</th><th>Use Case</th></tr></thead>
        <tbody>
          <tr><td>temperature</td><td>°C</td><td>-20 to 40</td><td>Air temperature</td></tr>
          <tr><td>humidity</td><td>%</td><td>0 to 100</td><td>Relative humidity</td></tr>
          <tr><td>pressure</td><td>hPa</td><td>990 to 1030</td><td>Barometric pressure</td></tr>
          <tr><td>wind-speed</td><td>km/h</td><td>0 to 30+</td><td>Current wind speed</td></tr>
          <tr><td>rainfall</td><td>mm</td><td>0 to 10</td><td>Accumulated rain</td></tr>
          <tr><td>rain-rate</td><td>mm/h</td><td>0 to 10</td><td>Rain intensity</td></tr>
          <tr><td>solar</td><td>W/m²</td><td>0 to 1000</td><td>Solar radiation</td></tr>
          <tr><td>uv-index</td><td>-</td><td>0 to 10+</td><td>UV intensity</td></tr>
          <tr><td>cloud-base</td><td>m</td><td>0 to 1000</td><td>Cloud base altitude</td></tr>
        </tbody>
      </table>
      <p class="doc-p">Try presets in the <a class="doc-link" href="/radial" data-nav="true">Radial playground</a>.</p>
    </section>

    <section class="doc-section">
      <h2 class="doc-h2">Scale (Min / Max)</h2>
      <p class="doc-p">
        The gauge scale defines the visible range. Scalar gauges read best when the scale matches the story
        you want to tell.
      </p>
      <div class="callout">
        <strong>Rule of thumb:</strong> choose scale first, then choose warning/critical thresholds.
      </div>
      <p class="doc-p">
        For example, a temperature gauge for indoor use might use 15-30°C while an outdoor gauge might use
        -20-40°C. The narrower range provides better resolution for your use case.
      </p>
    </section>

    <section class="doc-section">
      <h2 class="doc-h2">Alerts and Thresholds</h2>
      <p class="doc-p">
        Gauges support multiple alert mechanisms:
      </p>
      <ul class="doc-list">
        <li><strong>Threshold marker</strong>: A single point on the scale indicating a target value</li>
        <li><strong>Warning alert</strong>: Changes gauge tone when value exceeds warning threshold</li>
        <li><strong>Critical alert</strong>: Changes gauge tone when value exceeds critical threshold</li>
        <li><strong>Sections</strong>: Colored ranges on the dial background showing safe/warning/danger zones</li>
        <li><strong>Areas</strong>: Highlighted regions marking measured min/max history</li>
      </ul>
      <p class="doc-p">
        Tone changes affect pointer color, LCD display, and LED indicators. Explore in the 
        <a class="doc-link" href="/radial" data-nav="true">Radial playground</a>.
      </p>
    </section>

    <section class="doc-section">
      <h2 class="doc-h2">Wind Rose Petals</h2>
      <p class="doc-p">
        The wind rose displays wind direction distribution over time. Each "petal" represents a direction bin
        (typically 8, 16, or 32 bins) with petal length indicating frequency/intensity.
      </p>
      <p class="doc-p">
        Petals are defined as an array of objects with direction (degrees), value, and optional color.
        Explore in the <a class="doc-link" href="/wind-rose" data-nav="true">Wind Rose playground</a>.
      </p>
    </section>

    <section class="doc-section">
      <h2 class="doc-h2">Attributes vs Properties</h2>
      <p class="doc-p">
        This is the most common source of confusion. In HTML, attributes are strings:
      </p>
      <pre class="code"><code>&lt;wx-gauge value="72"&gt;&lt;/wx-gauge&gt;</code></pre>
      <p class="doc-p">
        When you need numeric values (especially for updates), use JavaScript properties:
      </p>
      <pre class="code"><code>const gauge = document.querySelector('wx-gauge')
gauge.value = 72  // property - typed
gauge.setAttribute('value', '72')  // attribute - string</code></pre>
      <div class="callout">
        <strong>Tip:</strong> If a value "seems ignored", check whether you're using an attribute when you need a property.
      </div>
    </section>

    <section class="doc-section">
      <h2 class="doc-h2">Component Types</h2>
      <p class="doc-p">
        Weather Gauges provides several component types for different measurements:
      </p>
      <ul class="doc-list">
        <li><code class="inline-code">wx-gauge</code>: Needle-type gauge for scalar values (temperature, pressure, etc.)</li>
        <li><code class="inline-code">wx-bargraph</code>: LED-style bargraph for values (humidity, rainfall)</li>
        <li><code class="inline-code">wx-compass</code>: Heading indicator (0-360 degrees)</li>
        <li><code class="inline-code">wx-wind-direction</code>: Wind direction with latest and average pointers</li>
        <li><code class="inline-code">wx-wind-rose</code>: Wind direction distribution over time</li>
      </ul>
      <p class="doc-p">
        See the <a class="doc-link" href="/" data-nav="true">Index</a> page for examples of each type.
      </p>
    </section>
  `
}
