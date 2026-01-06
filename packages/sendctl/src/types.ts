/**
 * Status of an individual check
 */
export type CheckStatus = 'ok' | 'failed' | 'skipped'

/**
 * Result of a single service check
 */
export interface CheckResult {
  status: CheckStatus
  duration_ms: number
  /** Present when status is 'failed' */
  error?: string
  /** Present when status is 'skipped' */
  reason?: string
  /** Sub-checks for services with multiple verification steps */
  sub_checks?: Record<string, CheckResult>
}

/**
 * Result of the doctor command (all services)
 */
export interface DoctorResult {
  success: boolean
  duration_ms: number
  checks: Record<string, CheckResult>
}

/**
 * Result of checking a single service
 */
export interface SingleCheckResult extends CheckResult {
  /** Name of the service checked (e.g., "anvil", "next") */
  service: string
}

/**
 * Configuration for HTTP-based health checks
 */
export interface HttpCheckConfig {
  url: string
  timeout: number
}

/**
 * Configuration for gRPC-based health checks
 */
export interface GrpcCheckConfig {
  /** host:port format (e.g., "localhost:7233") */
  address: string
  timeout: number
}

/**
 * Configuration for Supabase health checks
 */
export interface SupabaseCheckConfig extends HttpCheckConfig {
  /** Required for auth header - may be undefined if not configured */
  anonKey?: string
}

/**
 * Complete environment configuration
 */
export interface Environment {
  next: HttpCheckConfig
  supabase: SupabaseCheckConfig
  anvil: HttpCheckConfig
  bundler: HttpCheckConfig
  shovel: HttpCheckConfig
  temporal: GrpcCheckConfig
}

/**
 * Available service names for health checks
 */
export const SERVICE_NAMES = ['next', 'supabase', 'anvil', 'bundler', 'shovel', 'temporal'] as const
export type ServiceName = (typeof SERVICE_NAMES)[number]
