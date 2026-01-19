import test from 'node:test'
import assert from 'node:assert/strict'

import { classifyBucket, isPhraseTerm } from '../lib/canonical.js'

test('classifyBucket groups letters and digits', () => {
  assert.equal(classifyBucket('apple'), 'a')
  assert.equal(classifyBucket('Zebra'), 'z')
  assert.equal(classifyBucket('123abc'), '0-9')
})

test('classifyBucket groups non-alphanumerics as 0-9', () => {
  assert.equal(classifyBucket('!wow'), '0-9')
})

test('isPhraseTerm detects spaces and slashes', () => {
  assert.equal(isPhraseTerm('ice cream'), true)
  assert.equal(isPhraseTerm('and/or'), true)
  assert.equal(isPhraseTerm('co-op'), false)
})
