import { expect, test } from '@jest/globals'
import { TamaguiProvider, config } from '@my/ui'
import { render } from '@testing-library/react-native'
import { LeaderboardScreen } from './screen'

test('LeaderboardScreen', () => {
  const tree = render(
    <TamaguiProvider defaultTheme={'dark'} config={config}>
      <LeaderboardScreen />
    </TamaguiProvider>
  ).toJSON()
  expect(tree).toMatchSnapshot()
})
