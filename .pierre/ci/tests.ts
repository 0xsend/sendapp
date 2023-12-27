import { run } from 'pierre'

export const label = 'Tests'

export default async ({ id, branch }) => {
  process.env.CI = 'true'
  await run('eval "$(curl https://pkgx.sh)" && dev && tilt ci', {
    label: 'Tilt CI',
  })
}
