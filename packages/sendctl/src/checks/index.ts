import type { CheckResult, Environment, ServiceName } from '../types.js'
import { checkAnvil } from './anvil.js'
import { checkBundler } from './bundler.js'
import { checkNext } from './next.js'
import { checkShovel } from './shovel.js'
import { checkSupabase } from './supabase.js'
import { checkTemporal } from './temporal.js'

export { checkNext } from './next.js'
export { checkSupabase } from './supabase.js'
export { checkAnvil } from './anvil.js'
export { checkBundler } from './bundler.js'
export { checkShovel } from './shovel.js'
export { checkTemporal } from './temporal.js'

/**
 * Run a single service check
 */
export async function runCheck(service: ServiceName, env: Environment): Promise<CheckResult> {
  switch (service) {
    case 'next':
      return checkNext(env.next)
    case 'supabase':
      return checkSupabase(env.supabase)
    case 'anvil':
      return checkAnvil(env.anvil)
    case 'bundler':
      return checkBundler(env.bundler)
    case 'shovel':
      return checkShovel(env.shovel)
    case 'temporal':
      return checkTemporal(env.temporal)
    default: {
      const _exhaustive: never = service
      throw new Error(`Unknown service: ${_exhaustive}`)
    }
  }
}

/**
 * Order of checks for doctor command
 * Bundler depends on anvil, so anvil comes first
 */
export const CHECK_ORDER: ServiceName[] = [
  'next',
  'supabase',
  'anvil',
  'bundler',
  'shovel',
  'temporal',
]
