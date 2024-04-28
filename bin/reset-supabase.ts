#!/usr/bin/env bun run
import 'zx/globals'

/**
 * Deletes all docker containers and volumes matching the name "supabase".
 * This is useful for resetting the local development environment.
 */

const containers = (await $`docker ps -a --format '{{.Names}}'`).stdout
  .split('\n')
  .filter((c) => c.match(/supabase/i))

const volumes = (await $`docker volume ls --format '{{.Name}}'`).stdout
  .split('\n')
  .filter((c) => c.match(/supabase/i))

console.log(`Deleting supabase containers and volumes:\n${[...containers, ...volumes].join('\n')}`)

if (!$.env.NONINTERACTIVE) {
  const response = await question('Type "yes" to continue: ')
  if (response !== 'yes') {
    console.log('Exiting...')
    process.exit(0)
  }
}

$.verbose = true

if (containers.length > 0) {
  await $`docker kill ${containers}`
  await $`docker rm ${containers}`
}

if (volumes.length > 0) {
  await $`docker volume rm ${volumes}`
}

console.log(chalk.green('Done!'))
