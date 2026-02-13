import { css } from 'lit'

export const sharedStyles = css`
  :host {
    --wx-font-family: system-ui, sans-serif;
    --wx-text-color: #eceff3;
    --wx-background-color: #16202a;
    --wx-frame-color: #4b5563;
    --wx-accent-color: #c5162e;
    --wx-warning-color: #d97706;
    --wx-danger-color: #ef4444;
    display: inline-block;
    font-family: var(--wx-font-family);
    color: var(--wx-text-color);
  }

  :host([theme='classic']) {
    --wx-text-color: #eceff3;
    --wx-background-color: #16202a;
    --wx-frame-color: #4b5563;
    --wx-accent-color: #c5162e;
    --wx-warning-color: #d97706;
    --wx-danger-color: #ef4444;
  }

  :host([theme='flat']) {
    --wx-text-color: #0f172a;
    --wx-background-color: #e2e8f0;
    --wx-frame-color: #94a3b8;
    --wx-accent-color: #0f766e;
    --wx-warning-color: #b45309;
    --wx-danger-color: #b91c1c;
  }

  :host([theme='high-contrast']) {
    --wx-text-color: #ffffff;
    --wx-background-color: #0a0a0a;
    --wx-frame-color: #f5f5f5;
    --wx-accent-color: #38bdf8;
    --wx-warning-color: #facc15;
    --wx-danger-color: #fb7185;
    --wx-trend-up-outer: #38bdf8;
    --wx-trend-up-corona: #7dd3fc;
    --wx-trend-steady-outer: #86efac;
    --wx-trend-steady-corona: #bef264;
    --wx-trend-down-outer: #fda4af;
    --wx-trend-down-corona: #fecdd3;
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
