import { expect, test } from '@jest/globals'
import { render } from '@testing-library/react-native'
import { HomeScreen } from './screen'
// import { Provider } from '../../provider'
import { UniversalThemeProvider } from 'app/provider/theme'
import { TamaguiProvider } from '@my/ui'
import config from '../../tamagui.config'

test('HomeScreen', () => {
  const tree = render(
    // TODO: use our base provider
    <TamaguiProvider defaultTheme={'light'} config={config}>
      <HomeScreen />
    </TamaguiProvider>
  ).toJSON()
  expect(tree).toMatchSnapshot()
})
