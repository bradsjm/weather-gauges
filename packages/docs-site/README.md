# @bradsjm/weather-gauges-docs

Documentation and interactive playground site for Weather Gauges.

## Overview

`@bradsjm/weather-gauges-docs` is an interactive documentation and playground site that demonstrates the Weather Gauges component library. Built with Vite, it provides live demos for all gauge types with interactive controls and configuration examples.

## Key Features

- **Interactive Playground**: Live demos of all gauge types with real-time updates
- **Configuration Explorer**: Interactive controls to explore gauge options and styling
- **Live State Preview**: View gauge state and contract events in real-time
- **Multiple Gauge Examples**: Compass, radial, radial-bargraph, wind-direction, wind-rose
- **Code Examples**: Copy-paste ready HTML examples for each gauge type
- **Responsive Design**: Works on desktop and mobile devices
- **Client-Side Routing**: History API navigation between pages

## Installation

This is a private package and is not published to npm. It's included in the monorepo for development purposes.

```bash
# Install dependencies (from repo root)
pnpm install
```

## Quick Start

```bash
# Start development server
pnpm --filter @bradsjm/weather-gauges-docs dev

# Open http://localhost:5173 in your browser
```

## Pages and Routes

The docs site includes the following pages:

| Route              | Page            | Description                                 |
| ------------------ | --------------- | ------------------------------------------- |
| `/`                | Index           | Overview and quick links to all gauge types |
| `/start-here`      | Start Here      | Installation and quick start guide          |
| `/concepts`        | Concepts        | Core concepts and terminology               |
| `/theming`         | Theming         | CSS custom properties and theming           |
| `/integrations`    | Integrations    | Framework integrations                      |
| `/troubleshooting` | Troubleshooting | Common issues and solutions                 |
| `/radial`          | Radial Gauge    | Interactive radial gauge demo               |
| `/radial-bargraph` | Radial Bargraph | Interactive radial bargraph demo            |
| `/compass`         | Compass         | Interactive compass demo                    |
| `/wind-direction`  | Wind Direction  | Interactive wind direction demo             |
| `/wind-rose`       | Wind Rose       | Interactive wind rose demo                  |

## Page Structure

Each page follows a consistent layout using a sidebar navigation:

### Top Bar

- Sticky header with brand title
- GitHub link
- Mobile: hamburger menu toggle

### Sidebar (Desktop)

- Search filter for finding pages
- Navigation grouped by section
- Active page highlighted
- Keywords for searchability

### Main Content

- Page title and subtitle
- Documentation sections with hero elements
- Interactive playground for gauge demos (on playground pages)
- Code examples with copy functionality

### Playground Pages

Gauge playground pages use a two-column layout:

#### Gauge Panel

Left side (desktop) or top (mobile):

- Live gauge preview
- Responsive sizing
- Real-time updates

#### Control Panel

Right side (desktop) or bottom (mobile):

- Interactive controls for gauge options
- Input fields and checkboxes
- Select dropdowns for options
- State preview showing current configuration

## Development

### Prerequisites

The docs site requires the core and elements packages to be built first. This is handled automatically via prebuild scripts:

```json
{
  "predev": "pnpm --filter @bradsjm/weather-gauges-core build && pnpm --filter @bradsjm/weather-gauges-elements build",
  "prebuild": "pnpm --filter @bradsjm/weather-gauges-core build && pnpm --filter @bradsjm/weather-gauges-elements build"
}
```

### Scripts

```bash
# Development server (hot reload)
pnpm dev

# Build for production
pnpm build

# Typecheck
pnpm typecheck

# Lint
pnpm lint

# Clean build artifacts
pnpm clean
```

### Building

The build output is generated using Vite:

```bash
pnpm build
```

Output: `dist/` directory (optimized, minified production build)

### Development Workflow

1. Make changes to gauge components in `packages/core` or `packages/elements`
2. Rebuild: `pnpm --filter @bradsjm/weather-gauges-elements build`
3. Refresh docs site: The dev server will pick up changes automatically
4. Test interactive controls and demos
5. Verify state preview and event handling

## Adding a New Gauge Page

To add a new gauge type demo:

1. Create a new page file: `src/pages/[gauge-name]-page.ts`
2. Implement the page render function:

```typescript
import type { PageEffect } from '../types'

export const renderGaugeNamePage = (root: HTMLElement): PageEffect => {
  root.innerHTML = `
    <div class="page-layout">
      <div class="gauge-panel">
        <wx-gauge-name id="demo" value="50" size="300"></wx-gauge-name>
      </div>
      <div class="control-panel">
        <!-- Controls here -->
      </div>
    </div>
  `

  const gauge = root.querySelector('#demo') as HTMLElement

  // Add event listeners and control logic here

  // Return cleanup function
  return () => {
    // Cleanup event listeners
  }
}
```

3. Import in `src/main.ts`:

```typescript
import { renderGaugeNamePage } from './pages/gauge-name-page'
```

4. Add route handling in `src/main.ts`:

```typescript
if (route === '/gauge-name') {
  renderGaugeNamePage(root)
}
```

5. Add navigation link in `src/shell.ts`:

```typescript
const links: Array<{ path: Route; label: string }> = [
  { path: '/', label: 'Index' },
  { path: '/gauge-name', label: 'Gauge Name' }
  // ... other links
]
```

6. Add route check in `currentRoute()` in `src/shell.ts`:

```typescript
export const currentRoute = (): Route => {
  const path = window.location.pathname
  if (
    path === '/gauge-name' || // Add new route
    path === '/radial' ||
    // ... other routes
  ) {
    return path
  }
  return '/'
}
```

## Styling

The docs site uses a custom styling system defined in `src/shell.ts`. Key styles:

### Layout

- **`.docs-shell`**: Main container with gradient background
- **`.topbar`**: Sticky header bar
- **`.sidebar`**: Navigation sidebar (sticky on desktop)
- **`.docs-main`**: Main content area
- **`.page-layout`**: Two-column grid layout for playground pages (gauge panel + control panel)

### Components

- **`.gauge-panel`**: Grid container for gauge display
- **`.control-panel`**: Control panel with inputs
- **`.control-item`**: Individual control with label and input
- **`.demo-card`**: Card component for index page demos
- **`.state-preview`**: JSON state preview with dark background

### Colors (CSS Custom Properties)

- **Paper/Background**: `#f3efe6` (light warm beige)
- **Ink/Text**: `#0c1520` (dark navy)
- **Accent**: `#ff5a2f` (coral orange)
- **Sea**: `#2aa7a1` (teal)

### Responsive

Breakpoint at 980px switches from two-column to single-column layout:

```css
@media (max-width: 980px) {
  .page-layout {
    grid-template-columns: 1fr;
  }
}
```

## Type Definitions

Custom types are defined in `src/types.ts`:

```typescript
export type Route =
  | '/'
  | '/start-here'
  | '/concepts'
  | '/theming'
  | '/integrations'
  | '/troubleshooting'
  | '/radial'
  | '/radial-bargraph'
  | '/compass'
  | '/wind-direction'
  | '/wind-rose'

export type PageEffect = () => void | (() => void)
```

## Architecture

### Entry Point

`src/main.ts` is the entry point:

1. Imports all page render functions
2. Sets up routing based on `window.location.pathname`
3. Renders shell with navigation
4. Renders appropriate page content
5. Sets up navigation click handlers
6. Listens for `popstate` events

### Shell System

`src/shell.ts` provides:

- **`currentRoute()`**: Determines current route from URL
- **`renderShell(route)`**: Renders navigation and main container
- **CSS styles**: All styling for the docs site

### Page System

Each page in `src/pages/` follows a consistent pattern:

1. **Import types**: Type definitions and gauge elements
2. **Page function**: Takes `HTMLElement` root, returns cleanup function
3. **Render HTML**: Set `root.innerHTML` with page layout
4. **Select elements**: Get references to gauge and controls
5. **Add listeners**: Set up event handlers
6. **Return cleanup**: Return function to clean up listeners

## Client-Side Routing

Simple hash-free routing using HTML5 History API:

```typescript
// Navigation
window.history.pushState({}, '', targetPath)

// Back button handling
window.addEventListener('popstate', renderPage)

// Route detection
const path = window.location.pathname
```

## Performance

### Optimization

- **Minimal dependencies**: Only depends on `@bradsjm/weather-gauges-elements`
- **Prebuild steps**: Ensures dependencies are built before dev/build
- **Vite optimization**: Fast HMR and optimized production builds
- **Tree-shaking**: Unused code is eliminated in production

### Best Practices

- Reuse gauge elements instead of recreating
- Use event delegation where possible
- Clean up event listeners in page effects
- Avoid unnecessary re-renders

## Browser Support

- Chrome/Edge: Latest 2 versions
- Firefox: Latest 2 versions
- Safari: Latest 2 versions
- Mobile browsers: iOS Safari, Chrome Mobile

Requires:

- ES2020+ support
- Web Components (Custom Elements, Shadow DOM)
- Canvas API
- HTML5 History API

## Deployment

### Local Preview

```bash
pnpm build
pnpm preview
```

### Static Hosting

The build output in `dist/` can be deployed to any static hosting service:

- **Vercel**: Deploy as a static site
- **Netlify**: Deploy as a static site
- **GitHub Pages**: Deploy to `gh-pages` branch
- **Cloudflare Pages**: Deploy as a static site

### Environment Variables

No environment variables are required. The docs site works without any configuration.

## Troubleshooting

### Dev Server Won't Start

Ensure dependencies are installed:

```bash
pnpm install
```

Ensure core and elements packages are built:

```bash
pnpm --filter @bradsjm/weather-gauges-core build
pnpm --filter @bradsjm/weather-gauges-elements build
```

### Gauge Not Rendering

- Check browser console for errors
- Verify the gauge element is imported in `src/main.ts`
- Ensure the core and elements packages are built
- Check that the component tag name is correct (e.g., `wx-compass`)

### State Preview Not Updating

- Verify the `wx-state-change` event listener is set up
- Check that the gauge value is being updated correctly
- Ensure the state preview element is selected correctly

### Controls Not Working

- Verify event listeners are attached after DOM is rendered
- Check that element IDs match between HTML and JavaScript
- Ensure input values are properly typed

## Contributing

When contributing to the docs site:

1. **Follow existing patterns**: Use the same structure as existing pages
2. **Keep it simple**: Avoid adding unnecessary complexity
3. **Test responsiveness**: Ensure pages work on mobile and desktop
4. **Check accessibility**: Ensure controls have proper labels
5. **Use consistent styling**: Follow the established design system

## Future Enhancements

Potential improvements to the docs site:

- [ ] Dark mode toggle
- [ ] Export configuration as code snippets
- [ ] Side-by-side comparison of gauges
- [ ] Integration tests for all demo pages
- [ ] A11y audit and improvements
- [ ] Print-friendly documentation pages

## Related Packages

- [@bradsjm/weather-gauges-core](../core/README.md): Framework-agnostic rendering engine
- [@bradsjm/weather-gauges-elements](../elements/README.md): Lit web components
- [@bradsjm/weather-gauges-ha-cards](../ha-cards/README.md): Home Assistant cards

## License

MIT

## Support

- **GitHub Issues**: Report bugs and request features at [github.com/bradsjm/weather-gauges/issues](https://github.com/bradsjm/weather-gauges/issues)
