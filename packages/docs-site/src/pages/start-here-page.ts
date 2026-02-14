export const renderStartHerePage = (root: HTMLElement): void => {
  root.innerHTML = `
    <header class="doc-hero">
      <p class="doc-eyebrow">Field Manual</p>
      <h1 class="doc-title">Start Here</h1>
      <p class="doc-lede">
        Weather Gauges is a set of animated, weather-oriented instruments for web UIs. You can use the
        Web Components directly, or build on the core renderer.
      </p>
    </header>

    <section class="doc-section">
      <h2 class="doc-h2">Install</h2>
      <p class="doc-p">For most users: install the Web Components package.</p>
      <pre class="code"><code>pnpm add @bradsjm/weather-gauges-elements</code></pre>
      <p class="doc-p">If you want the renderer only (no custom elements):</p>
      <pre class="code"><code>pnpm add @bradsjm/weather-gauges-core</code></pre>
    </section>

    <section class="doc-section">
      <h2 class="doc-h2">Use In A Regular HTML Page</h2>
      <p class="doc-p">
        Import the elements once (as a module), then use the custom tags in your markup.
      </p>
      <pre class="code"><code>&lt;!doctype html&gt;
&lt;html lang="en"&gt;
  &lt;head&gt;
    &lt;meta charset="utf-8" /&gt;
    &lt;meta name="viewport" content="width=device-width, initial-scale=1" /&gt;
    &lt;title&gt;Weather Gauges Demo&lt;/title&gt;
    &lt;script type="module"&gt;
      import '@bradsjm/weather-gauges-elements'

      const el = document.querySelector('wx-compass')
      if (el) el.value = 135
    &lt;/script&gt;
  &lt;/head&gt;
  &lt;body&gt;
    &lt;wx-compass value="45" size="240" label="Heading" unit="deg"&gt;&lt;/wx-compass&gt;
  &lt;/body&gt;
&lt;/html&gt;</code></pre>
      <div class="callout">
        <strong>Tip:</strong> attributes are strings in HTML. For numeric updates, properties are the safest:
        <code class="inline-code">el.value = 135</code>.
      </div>
    </section>

    <section class="doc-section">
      <h2 class="doc-h2">Use In A React App</h2>
      <p class="doc-p">
        React can render Web Components, but you typically set numeric values via a <code class="inline-code">ref</code>.
        Import the elements once at app startup.
      </p>
      <pre class="code"><code>// main.tsx
import React from 'react'
import ReactDOM from 'react-dom/client'
import '@bradsjm/weather-gauges-elements'
import { App } from './App'

ReactDOM.createRoot(document.getElementById('root')!).render(
  &lt;React.StrictMode&gt;
    &lt;App /&gt;
  &lt;/React.StrictMode&gt;
)</code></pre>

      <pre class="code"><code>// App.tsx
import React, { useEffect, useRef } from 'react'

export const App = () =&gt; {
  const compassRef = useRef&lt;HTMLElement | null&gt;(null)

  useEffect(() =&gt; {
    const el = compassRef.current as (HTMLElement &amp; { value?: number }) | null
    if (el) el.value = 135
  }, [])

  return (
    &lt;div style={{ padding: 24 }}&gt;
      &lt;wx-compass ref={compassRef} value="45" size="240" label="Heading" unit="deg" /&gt;
    &lt;/div&gt;
  )
}</code></pre>

      <p class="doc-p">
        If you use TypeScript, add a minimal JSX typing once so <code class="inline-code">&lt;wx-compass /&gt;</code> is allowed:
      </p>
      <pre class="code"><code>// src/custom-elements.d.ts
declare namespace JSX {
  interface IntrinsicElements {
    'wx-compass': any
    'wx-gauge': any
    'wx-bargraph': any
    'wx-wind-direction': any
    'wx-wind-rose': any
  }
}</code></pre>
    </section>

    <section class="doc-section">
      <h2 class="doc-h2">What You Can Rely On</h2>
      <p class="doc-p">
        The project is converging on a stable, HTML-first attribute API for the essentials
        (value/scale/label/unit/size/preset/animation). The playground pages are intentionally more
        expansive and may use JS properties that change faster.
      </p>
      <p class="doc-p">Next: read <a class="doc-link" href="/concepts" data-nav="true">Concepts</a>, then open a playground.</p>
    </section>
  `
}
