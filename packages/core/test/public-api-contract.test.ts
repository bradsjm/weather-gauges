import { describe, expect, it } from 'vitest'

import { alphaRuntimeExports } from '../src/contracts/alpha-runtime-exports.js'
import * as core from '../src/index.js'

describe('core alpha public API contract', () => {
  it('matches frozen runtime export baseline', () => {
    const runtimeExports = Object.keys(core).sort()
    expect(runtimeExports).toEqual([...alphaRuntimeExports])
  })
})
