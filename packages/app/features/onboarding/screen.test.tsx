import { expect, test } from '@jest/globals'
import { render } from '@testing-library/react-native'
import { OnboardingScreen } from './screen'
import { TamaguiProvider, config } from '@my/ui'

jest.mock('@daimo/expo-passkeys', () => ({
  createPasskey: jest.fn(),
  signWithPasskey: jest.fn(),
}))

afterEach(() => {
  // restore the spy created with spyOn
  jest.restoreAllMocks()
})

jest.useFakeTimers()
jest.setSystemTime(new Date('2023-01-01T00:00:00.000Z'))
test(OnboardingScreen.name, () => {
  jest.spyOn(Date.prototype, 'toLocaleString').mockReturnValue('foobar')
  const tree = render(
    <TamaguiProvider defaultTheme={'dark'} config={config}>
      <OnboardingScreen />
    </TamaguiProvider>
  ).toJSON()
  expect(tree).toMatchSnapshot()
})
