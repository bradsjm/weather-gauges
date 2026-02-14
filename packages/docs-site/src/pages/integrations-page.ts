export const renderIntegrationsPage = (root: HTMLElement): void => {
  root.innerHTML = `
    <header class="doc-hero">
      <p class="doc-eyebrow">Deployment</p>
      <h1 class="doc-title">Integrations</h1>
      <p class="doc-lede">Common ways to embed Weather Gauges without surprises.</p>
    </header>

    <section class="doc-section">
      <h2 class="doc-h2">Vanilla / Web Components</h2>
      <pre class="code"><code>import '@bradsjm/weather-gauges-elements'\n\nconst gauge = document.createElement('wx-gauge')\ngauge.setAttribute('size', '300')\ngauge.setAttribute('value', '72')\ngauge.setAttribute('label', 'Humidity')\ngauge.setAttribute('unit', '%')\ndocument.querySelector('#app')?.append(gauge)</code></pre>
    </section>

    <section class="doc-section">
      <h2 class="doc-h2">Home Assistant</h2>
      <p class="doc-p">Home Assistant wrappers live in <code class="inline-code">@bradsjm/weather-gauges-ha-cards</code>.</p>
      <p class="doc-p">Start at the package README and use the playground pages to tune the look.</p>
    </section>

    <section class="doc-section">
      <h2 class="doc-h2">Static Hosting Note</h2>
      <p class="doc-p">
        This docs site is an SPA (History API). Configure your host to rewrite unknown routes to
        <code class="inline-code">/index.html</code>.
      </p>
    </section>
  `
}
