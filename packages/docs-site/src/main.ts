import '@bradsjm/steelseries-v3-elements'

const app = document.querySelector<HTMLDivElement>('#app')

if (app) {
  app.innerHTML = `
    <main style="font-family: system-ui, sans-serif; padding: 1rem;">
      <h1>SteelSeries v3 Docs Scaffold</h1>
      <p>Phase 0 docs and playground placeholder.</p>
      <steelseries-radial-v3 value="42"></steelseries-radial-v3>
    </main>
  `
}
