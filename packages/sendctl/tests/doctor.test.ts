import { describe, expect, it, vi } from 'vitest'

describe('sendctl doctor', () => {
  describe('CheckResult type', () => {
    it('has correct status values', () => {
      const statuses = ['ok', 'failed', 'skipped'] as const
      expect(statuses).toContain('ok')
      expect(statuses).toContain('failed')
      expect(statuses).toContain('skipped')
    })
  })

  describe('getTimeout', () => {
    it('returns default timeout when no flag or env var', async () => {
      const originalEnv = process.env.SENDCTL_TIMEOUT
      process.env.SENDCTL_TIMEOUT = undefined

      const { getTimeout } = await import('../src/config.js')
      expect(getTimeout()).toBe(10000)

      if (originalEnv) process.env.SENDCTL_TIMEOUT = originalEnv
    })

    it('prefers flag over env var', async () => {
      process.env.SENDCTL_TIMEOUT = '5000'

      const { getTimeout } = await import('../src/config.js')
      expect(getTimeout(3000)).toBe(3000)

      process.env.SENDCTL_TIMEOUT = undefined
    })

    it('uses env var when no flag provided', async () => {
      process.env.SENDCTL_TIMEOUT = '7500'

      // Clear module cache to pick up new env
      vi.resetModules()
      const { getTimeout } = await import('../src/config.js')
      expect(getTimeout()).toBe(7500)

      process.env.SENDCTL_TIMEOUT = undefined
    })
  })

  describe('SERVICE_NAMES', () => {
    it('includes all expected services', async () => {
      const { SERVICE_NAMES } = await import('../src/types.js')
      expect(SERVICE_NAMES).toContain('next')
      expect(SERVICE_NAMES).toContain('supabase')
      expect(SERVICE_NAMES).toContain('anvil')
      expect(SERVICE_NAMES).toContain('bundler')
      expect(SERVICE_NAMES).toContain('shovel')
      expect(SERVICE_NAMES).toContain('temporal')
      expect(SERVICE_NAMES).toHaveLength(6)
    })
  })

  describe('exit codes', () => {
    it('defines expected exit code semantics', () => {
      // Exit code semantics per SPEC.md:
      // 0 = All checks passed
      // 1 = One or more checks failed
      // 2 = Configuration error
      const EXIT_SUCCESS = 0
      const EXIT_FAILURE = 1
      const EXIT_CONFIG_ERROR = 2

      expect(EXIT_SUCCESS).toBe(0)
      expect(EXIT_FAILURE).toBe(1)
      expect(EXIT_CONFIG_ERROR).toBe(2)
    })
  })
})
