import type { NextApiRequest, NextApiResponse } from 'next'

/**
 * Version endpoint for detecting client/server version skew.
 * Returns the current Git commit SHA from the deployment.
 *
 * This endpoint is used by the VersionUpdater component to check if
 * the client needs to refresh to get the latest code.
 *
 * Vercel automatically provides VERCEL_GIT_COMMIT_SHA in deployments.
 * For other environments, provide GIT_HASH or similar.
 */

const KNOWN_GIT_ENV_VARS = ['VERCEL_GIT_COMMIT_SHA', 'CF_PAGES_COMMIT_SHA', 'GIT_HASH']

async function getGitHash(): Promise<string> {
  // Check known environment variables first
  for (const envVar of KNOWN_GIT_ENV_VARS) {
    if (process.env[envVar]) {
      return process.env[envVar] as string
    }
  }

  // Fallback to git command in development
  if (process.env.NODE_ENV === 'development') {
    try {
      const { execSync } = await import('node:child_process')
      return execSync('git log --pretty=format:"%h" -n1').toString().trim()
    } catch (error) {
      console.warn('[WARN] Could not get git hash from command:', error)
      return 'dev'
    }
  }

  console.warn(
    '[WARN] Could not find git hash. Provide VERCEL_GIT_COMMIT_SHA or GIT_HASH environment variable.'
  )
  return 'unknown'
}

export default async function handler(_req: NextApiRequest, res: NextApiResponse<string>) {
  const currentGitHash = await getGitHash()

  // Set cache headers to prevent caching
  res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate')
  res.setHeader('Pragma', 'no-cache')
  res.setHeader('Expires', '0')

  res.status(200).send(currentGitHash)
}
