import { run } from 'pierre'

export const label = 'Tests'

export default async ({ id, branch }) => {
  process.env.CI = '1'
  await run('tilt ci', {
    label: 'Tilt CI',
  })
}
