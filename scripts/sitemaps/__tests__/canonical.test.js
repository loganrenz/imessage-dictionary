import test from 'node:test'
import assert from 'node:assert/strict'

import { canonicalPath, normalizeTerm } from '../lib/canonical.js'

test('normalizeTerm trims and lowercases', () => {
  assert.equal(normalizeTerm('  Serendipity '), 'serendipity')
})

test('canonicalPath encodes terms', () => {
  assert.equal(canonicalPath('sea horse'), '/w/sea%20horse')
  assert.equal(canonicalPath('C++'), '/w/c%2B%2B')
})
