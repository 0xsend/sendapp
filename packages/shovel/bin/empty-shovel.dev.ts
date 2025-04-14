import 'zx/globals'
import { integrations } from '../src'

$.verbose = true

console.log(chalk.red('Emptying shovel integration tables'))

for (const integration of integrations) {
  console.log(chalk.blue(`Emptying ${integration.name}`))
  await $`psql $SUPABASE_DB_URL -c "delete from ${integration.table.name}"`.catch((e) => {
    console.log(chalk.red('Error deleting integration table'), e.message)
  })
}
await $`psql $SUPABASE_DB_URL -c "delete from shovel.task_updates"`.catch((e) => {
  console.log(chalk.red('Error deleting task_updates table'), e.message)
})

console.log(chalk.green('Done!'))
