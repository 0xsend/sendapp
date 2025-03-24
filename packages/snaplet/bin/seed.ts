/**
 * ! Executing this script will delete all data in your database and seed it with new users.
 * ! Make sure to adjust the script to your needs.
 * Use any TypeScript runner to run this script, for example: `npx tsx seed.ts`
 * Learn more about the Seed Client by following our guide: https://docs.snaplet.dev/seed/getting-started
 */
import { copycat, faker } from '@snaplet/copycat'
import { createSeedClient } from '@snaplet/seed'
import { models } from '../src'
import { pravatar } from '../src/utils'
import { leaderboardReferralsAllTimes, userOnboarded } from '../src/models'
import { baseMainnetClient } from '@my/wagmi'

const dryRun = process.env.DRY !== '0'

// This is a basic example generated by Snaplet to start you off, check out the docs for where to go from here
// * For more on getting started with @snaplet/seed: https://docs.snaplet.dev/getting-started/quick-start/seed
// * For a more detailed reference: https://docs.snaplet.dev/core-concepts/seed
;(async () => {
  const seed = await createSeedClient({
    dryRun,
    models,
  })

  console.log('Snaplet resetting database.', `dryRun=${dryRun}`)

  // Clears all existing data in the database, but keep the structure
  await seed.$resetDatabase(
    /**
     * Tables that should be selected when seeding
     */
    ['!pgtle.*', '!net.*', '!pgsodium.key']
  )

  console.log('Snaplet seeding database.')

  await seed.swap_routers([
    {
      router_addr: Buffer.from('0xc7d3ab410d49b664d03fe5b1038852ac852b1b29'),
      chain_id: baseMainnetClient.chain.id,
    },
  ])

  await seed.users([
    {
      phone: '17777777777',
      profiles: [
        {
          name: 'Alice',
          avatar_url: pravatar('Alice'),
          x_username: 'x_alice',
        },
      ],
      tags: [
        {
          name: 'alice',
          status: 'confirmed',
        },
        {
          name: '0xalice',
          status: 'confirmed',
        },
      ],
      send_accounts: [{}],
      chain_addresses: [{}],
      leaderboard_referrals_all_time: [leaderboardReferralsAllTimes],
    },
    {
      phone: '1234567890',
      profiles: [
        {
          name: 'Jane',
          avatar_url: pravatar('Jane'),
          x_username: 'x_jane',
        },
      ],
      tags: [
        {
          name: 'jane',
          status: 'confirmed',
        },
        {
          name: '0xjane',
          status: 'confirmed',
        },
      ],
      sendAccounts: [{}],
      chainAddresses: [{}],
      leaderboardReferralsAllTimes: [leaderboardReferralsAllTimes],
    },
    {
      phone: '15555555555',
      profiles: [
        {
          name: 'John',
          avatarUrl: pravatar('John'),
          x_username: 'x_john',
        },
      ],
      tags: [
        {
          name: 'john',
          status: 'confirmed',
        },
        {
          name: '0xjohn',
          status: 'confirmed',
        },
      ],
      sendAccounts: [{}],
      chainAddresses: [{}],
      leaderboardReferralsAllTimes: [leaderboardReferralsAllTimes],
    },
    ...Array(100).fill({
      ...userOnboarded,
      leaderboardReferralsAllTimes: [leaderboardReferralsAllTimes],
    }),
  ])
  console.log('Snaplet seed done!')
  process.exit()
})().catch((err) => {
  console.error('Snaplet seed failed:', err)
  process.exit(1)
})
