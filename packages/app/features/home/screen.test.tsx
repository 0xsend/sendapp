import { describe, expect, test } from '@jest/globals'
import renderer from 'react-test-renderer'
import { HomeScreen } from './screen'
// import { Provider } from '../../provider'
// import { UniversalThemeProvider } from 'app/provider/theme'
import { TamaguiProvider } from '@my/ui'
import config from '../../tamagui.config'

test('HomeScreen', () => {
  const tree = renderer
    .create(
      <TamaguiProvider config={config}>
        <HomeScreen />
      </TamaguiProvider>
    )
    .toJSON()
  expect(tree).toMatchSnapshot()
})
