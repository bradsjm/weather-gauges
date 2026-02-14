export const renderIntegrationsPage = (root: HTMLElement): void => {
  root.innerHTML = `
    <header class="doc-hero">
      <p class="doc-eyebrow">Deployment</p>
      <h1 class="doc-title">Integrations</h1>
      <p class="doc-lede">Common ways to embed Weather Gauges without surprises.</p>
    </header>

    <section class="doc-section">
      <h2 class="doc-h2">Vanilla / Web Components</h2>
      <p class="doc-p">
        Import the elements module once, then use custom tags anywhere in your HTML:
      </p>
      <pre class="code"><code>import '@bradsjm/weather-gauges-elements'

const gauge = document.createElement('wx-gauge')
gauge.setAttribute('size', '300')
gauge.setAttribute('value', '72')
gauge.setAttribute('label', 'Humidity')
gauge.setAttribute('unit', '%')
document.querySelector('#app')?.append(gauge)</code></pre>
      <p class="doc-p">Or directly in HTML:</p>
      <pre class="code"><code>&lt;script type="module"&gt;
  import '@bradsjm/weather-gauges-elements'
&lt;/script&gt;
&lt;wx-gauge size="300" value="72" label="Humidity" unit="%"&gt;&lt;/wx-gauge&gt;</code></pre>
    </section>

    <section class="doc-section">
      <h2 class="doc-h2">React</h2>
      <p class="doc-p">
        React can render Web Components, but you must set numeric values via refs:
      </p>
      <pre class="code"><code>import '@bradsjm/weather-gauges-elements'
import { useEffect, useRef } from 'react'

export const WeatherGauge = ({ value, label }) => {
  const ref = useRef(null)

  useEffect(() => {
    if (ref.current) {
      ref.current.value = value
    }
  }, [value])

  return &lt;wx-gauge ref={ref} size="240" label={label} /&gt;
}</code></pre>
    </section>

    <section class="doc-section">
      <h2 class="doc-h2">Vue</h2>
      <p class="doc-p">
        Vue works well with Web Components. Use v-bind for dynamic values:
      </p>
      <pre class="code"><code>&lt;template&gt;
  &lt;wx-gauge :value="value" :size="240" label="Temperature" unit="°C" /&gt;
&lt;/template&gt;

&lt;script setup&gt;
import '@bradsjm/weather-gauges-elements'
import { ref } from 'vue'

const value = ref(22)
&lt;/script&gt;</code></pre>
    </section>

    <section class="doc-section">
      <h2 class="doc-h2">CDN / ES Modules</h2>
      <p class="doc-p">
        For simple pages without a bundler, import directly from a CDN:
      </p>
      <pre class="code"><code>&lt;script type="module"&gt;
  import 'https://esm.sh/@bradsjm/weather-gauges-elements'
&lt;/script&gt;

&lt;wx-compass value="45" size="240" label="Heading" unit="deg"&gt;&lt;/wx-compass&gt;</code></pre>
    </section>

    <section class="doc-section">
      <h2 class="doc-h2">Home Assistant</h2>
      <p class="doc-p">
        Home Assistant wrappers live in <code class="inline-code">@bradsjm/weather-gauges-ha-cards</code>.
      </p>
      <p class="doc-p">
        See the package README for installation and configuration. Use the playground pages to tune the look, then copy
        the generated configuration to your HA dashboard.
      </p>
    </section>

    <section class="doc-section">
      <h2 class="doc-h2">Static Hosting (SPA)</h2>
      <p class="doc-p">
        This docs site is a single-page app using the History API. Configure your host to rewrite unknown routes to
        <code class="inline-code">/index.html</code>.
      </p>
      <h3 class="doc-h3">Vercel</h3>
      <p class="doc-p">Add <code class="inline-code">vercel.json</code>:</p>
      <pre class="code"><code>{
  "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }]
}</code></pre>
      <h3 class="doc-h3">Netlify</h3>
      <p class="doc-p">Add <code class="inline-code">_redirects</code>:</p>
      <pre class="code"><code>/* /index.html 200</code></pre>
      <h3 class="doc-h3">Cloudflare Pages</h3>
      <p class="doc-p">Add a <code class="inline-code">_headers</code> file:</p>
      <pre class="code"><code>/*
  X-Frame-Options: SAMEORIGIN
  Strict-Transport-Security: max-age=15552000
  /*
  History Api Fallback: true</code></pre>
    </section>
  `
}
