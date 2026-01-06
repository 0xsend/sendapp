import { Command } from 'commander'
import { check } from './commands/check.js'
import { doctor } from './commands/doctor.js'
import { SERVICE_NAMES } from './types.js'

const program = new Command()

program.name('sendctl').description('Send App Development Toolkit').version('0.0.1')

program
  .command('doctor')
  .description('Validate all Send App services are running and healthy')
  .option('--json', 'Output JSON instead of human-readable format')
  .option('--timeout <ms>', 'Timeout per check in milliseconds', Number.parseInt)
  .option('--wait', 'Poll until all checks pass or max retries exceeded')
  .option('--max-retries <n>', 'Max retry attempts in wait mode', Number.parseInt)
  .action(async (options) => {
    await doctor({
      json: options.json,
      timeout: options.timeout,
      wait: options.wait,
      maxRetries: options.maxRetries,
    })
  })

program
  .command('check <service>')
  .description(`Check a single service. Available: ${SERVICE_NAMES.join(', ')}`)
  .option('--json', 'Output JSON instead of human-readable format')
  .option('--timeout <ms>', 'Timeout in milliseconds', Number.parseInt)
  .action(async (service, options) => {
    await check(service, {
      json: options.json,
      timeout: options.timeout,
    })
  })

program.parse()
