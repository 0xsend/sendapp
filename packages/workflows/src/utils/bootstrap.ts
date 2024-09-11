const requiredEnvVars = [
  'NEXT_PUBLIC_BASE_CHAIN_ID',
  'NEXT_PUBLIC_BASE_RPC_URL',
  'NEXT_PUBLIC_BUNDLER_RPC_URL',
  'NEXT_PUBLIC_SUPABASE_URL',
  'SUPABASE_DB_URL',
  'SUPABASE_JWT_SECRET',
  'SUPABASE_SERVICE_ROLE',
] as const

/**
 * Bootstraps the workflow by setting up the environment variables that many of our clients depend on.
 * This is due to Temporal's deterministic execution requirements.
 *
 * In the Temporal TypeScript SDK, Workflows run in a deterministic sandboxed environment.
 * The code is bundled on Worker creation using Webpack, and can import any package as long as it does not reference Node.js or DOM APIs.
 *
 * @link https://docs.temporal.io/develop/typescript/core-application#workflow-logic-requirements
 */
export const bootstrap = (env: Record<string, string | undefined>) => {
  const varsSet: string[] = []
  for (const envVar of requiredEnvVars) {
    if (!env[envVar]) {
      throw new Error(`Missing required environment variable: ${envVar}`)
    }
    varsSet.push(envVar)
    globalThis.process.env[envVar] = env[envVar]
  }
  console.log('Bootstrapped environment variables:', varsSet)
}
