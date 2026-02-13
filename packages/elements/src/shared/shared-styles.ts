import { css } from 'lit'

export const sharedStyles = css`
  :host {
    --wx-font-family: system-ui, sans-serif;
    --wx-text-color: #eceff3;
    --wx-accent-color: #c5162e;
    --wx-warning-color: #d97706;
    --wx-danger-color: #ef4444;
    display: inline-block;
    font-family: var(--wx-font-family);
    color: var(--wx-text-color);
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
