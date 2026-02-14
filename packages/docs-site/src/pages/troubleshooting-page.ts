export const renderTroubleshootingPage = (root: HTMLElement): void => {
  root.innerHTML = `
    <header class="doc-hero">
      <p class="doc-eyebrow">Checklist</p>
      <h1 class="doc-title">Troubleshooting</h1>
      <p class="doc-lede">The common culprits, in the order they usually happen.</p>
    </header>

    <section class="doc-section">
      <h2 class="doc-h2">My value doesn't update</h2>
      <div class="callout">
        <strong>Use properties for numbers:</strong> <code class="inline-code">el.value = 42</code> is safer than attributes.
      </div>
      <pre class="code"><code>const el = document.querySelector('wx-compass')
if (el) el.value = 270</code></pre>
    </section>

    <section class="doc-section">
      <h2 class="doc-h2">I refreshed on /radial and got a 404</h2>
      <p class="doc-p">Your host needs SPA rewrites to <code class="inline-code">/index.html</code>.</p>
    </section>

    <section class="doc-section">
      <h2 class="doc-h2">Performance feels rough</h2>
      <p class="doc-p">Try smaller sizes, fewer simultaneous animations, and avoid updating every gauge every frame.</p>
    </section>
  `
}
