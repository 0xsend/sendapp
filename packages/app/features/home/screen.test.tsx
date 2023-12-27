import { expect, test } from '@jest/globals'
import { render } from '@testing-library/react-native'
import { HomeScreen } from './screen'
import { TamaguiProvider, config } from '@my/ui'

test('HomeScreen', () => {
  const tree = render(
    <TamaguiProvider defaultTheme={'dark'} config={config}>
      <HomeScreen />
    </TamaguiProvider>
  ).toJSON()
  expect(tree).toMatchSnapshot()
})
