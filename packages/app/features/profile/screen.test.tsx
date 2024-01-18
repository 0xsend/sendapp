import { test } from '@jest/globals'
import { ProfileScreen } from './screen'
import { TamaguiProvider, config } from '@my/ui'
import { render, screen } from '@testing-library/react-native'

const mockedNavigate = jest.fn()

jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({ navigate: mockedNavigate }),
}))

jest.mock('solito', () => ({
  useRoute: () => ({ params: { tag: 'test' } }),
  createParam: jest.fn().mockReturnValue({
    useParam: jest.fn().mockReturnValue(['test']),
  }),
}))

test('ProfileScreen', () => {
  render(
    <TamaguiProvider defaultTheme={'dark'} config={config}>
      <ProfileScreen />
    </TamaguiProvider>
  )
  const h1 = screen.getByText('Profile: test')
  expect(h1).toBeOnTheScreen()
  expect(screen.toJSON()).toMatchSnapshot('ProfileScreen')
})
