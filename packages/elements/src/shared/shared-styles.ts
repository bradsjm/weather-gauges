import { css } from 'lit'

export const sharedStyles = css`
  :host {
    --ss3-font-family: system-ui, sans-serif;
    --ss3-text-color: #eceff3;
    --ss3-accent-color: #c5162e;
    --ss3-warning-color: #d97706;
    --ss3-danger-color: #ef4444;
    display: inline-block;
    font-family: var(--ss3-font-family);
    color: var(--ss3-text-color);
  }

  canvas {
    display: block;
  }

  .sr-only {
    position: absolute;
    width: 1px;
    height: 1px;
    padding: 0;
    margin: -1px;
    overflow: hidden;
    clip: rect(0, 0, 0, 0);
    white-space: nowrap;
    border: 0;
  }
`
