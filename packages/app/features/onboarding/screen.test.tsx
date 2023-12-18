import { expect, test } from '@jest/globals'
import { render } from '@testing-library/react-native'
import { OnboardingScreen } from './screen'
import { TamaguiProvider, config } from '@my/ui'
import type { CreateResult, SignResult } from '@daimo/expo-passkeys'

jest.mock('@daimo/expo-passkeys', () => ({
  createPasskey: jest.fn(),
  signWithPasskey: jest.fn(),
}))

test(OnboardingScreen.name, () => {
  const tree = render(
    <TamaguiProvider defaultTheme={'dark'} config={config}>
      <OnboardingScreen />
    </TamaguiProvider>
  ).toJSON()
  expect(tree).toMatchSnapshot()
})
