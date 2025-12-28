#!/usr/bin/env bun run
import 'zx/globals'

/**
 * Deletes docker containers and volumes for the current workspace's Supabase instance.
 * Uses SUPABASE_PROJECT_ID or WORKSPACE_NAME to filter resources, preventing
 * accidental deletion of other workspaces' Supabase containers.
 */
$.verbose = true

const projectId = process.env.SUPABASE_PROJECT_ID || process.env.WORKSPACE_NAME
if (!projectId) {
  console.log(
    chalk.yellow(
      'Warning: SUPABASE_PROJECT_ID and WORKSPACE_NAME not set. Falling back to global supabase pattern.'
    )
  )
}

await $`bunx supabase stop --no-backup`

const allContainers = (await $`docker ps -a --format '{{.Names}}'`).stdout
  .split('\n')
  .filter(Boolean)
const allVolumes = (await $`docker volume ls --format '{{.Name}}'`).stdout
  .split('\n')
  .filter(Boolean)

let containers: string[]
let volumes: string[]

if (projectId) {
  const pattern = new RegExp(`supabase.*${projectId}`, 'i')
  containers = allContainers.filter((c) => pattern.test(c))
  volumes = allVolumes.filter((v) => pattern.test(v))
  console.log(chalk.blue(`Filtering supabase resources for workspace: ${projectId}`))
} else {
  containers = allContainers.filter((c) => /supabase/i.test(c))
  volumes = allVolumes.filter((v) => /supabase/i.test(v))
}

console.log(`Deleting supabase containers and volumes:\n${[...containers, ...volumes].join('\n')}`)

if (containers.length > 0) {
  await $`docker kill -s SIGKILL ${containers}`
  await $`docker rm ${containers}`
}

if (volumes.length > 0) {
  await $`docker volume rm ${volumes}`
}

console.log(chalk.green('Done!'))
