import { expect, test } from '@jest/globals'
import { render } from '@testing-library/react-native'
import { OnboardingScreen } from './screen'
import { TamaguiProvider, config } from '@my/ui'
import type { CreateResult, SignResult } from '@daimo/expo-passkeys'

const mockAttestations: CreateResult[] = [
  {
    // first bytes are the ASN.1 header (3059301306072a8648ce3d020106082a8648ce3d03010703420004)
    // last bytes are the x and y coordinates of the public key
    // public key '3059301306072a8648ce3d020106082a8648ce3d030107034200049e0ec64e75d6687d07a8060db040ac6bc2419b20c4e6b70ea8ac7737a93ebec513455f7d82c915b55eb76eb10f637387a38a3d6ed9536dd045ce0d70ca2998af'
    rawClientDataJSONB64:
      'eyJ0eXBlIjoid2ViYXV0aG4uY3JlYXRlIiwiY2hhbGxlbmdlIjoiYzI5dFpTQmphR0ZzYkdWdVoyVSIsIm9yaWdpbiI6Imh0dHBzOi8vc2VuZGFwcC5sb2NhbGhvc3QifQ==',
    rawAttestationObjectB64:
      'o2NmbXRkbm9uZWdhdHRTdG10oGhhdXRoRGF0YViUVVJTlMb5JhbV7rFoaFKDcCvBmzc1HOD7tW1Q7aed139dAAAAALraVWanqkAfvZZFYZpVEg0AEBH8VIF2M9LFEWC+4zQYvOOlAQIDJiABIVggng7GTnXWaH0HqAYNsECsa8JBmyDE5rcOqKx3N6k+vsUiWCATRV99gskVtV63brEPY3OHo4o9btlTbdBFzg1wyimYrw==',
  },
]

const mockAssertions: SignResult[] = [
  {
    passkeyName: 'sendappuser',
    rawClientDataJSONB64:
      'eyJ0eXBlIjoid2ViYXV0aG4uZ2V0IiwiY2hhbGxlbmdlIjoiWVc1dmRHaGxjaUJqYUdGc2JHVnVaMlUiLCJvcmlnaW4iOiJodHRwczovL3NlbmRhcHAubG9jYWxob3N0In0=',
    rawAuthenticatorDataB64: 'VVJTlMb5JhbV7rFoaFKDcCvBmzc1HOD7tW1Q7aed138dAAAAAA==',
    signatureB64:
      'MEUCIQDGxzi+evYGTKpT9kiQBlMp/VELbG0nKBhtNYeT4U4X9wIgZtQBydPYhD9QzRr56OF5ZnGlPiN6a0L63lgF98fM3sY=',
  },
]

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
