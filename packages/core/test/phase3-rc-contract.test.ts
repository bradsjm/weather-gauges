import { describe, expect, it } from 'vitest'

import { phase3RcRuntimeExports } from '../src/contracts/phase3-rc-runtime-exports.js'
import * as core from '../src/index.js'

describe('phase 3 rc public API freeze', () => {
  it('matches frozen phase 0-3 runtime export baseline', () => {
    const runtimeExports = Object.keys(core).sort()
    expect(runtimeExports).toEqual([...phase3RcRuntimeExports])
  })
})
