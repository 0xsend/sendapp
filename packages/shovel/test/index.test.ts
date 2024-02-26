import { config } from '../src'
import { test, expect } from 'bun:test'

test('shovel config', () => {
  expect(config).toMatchSnapshot()
})
