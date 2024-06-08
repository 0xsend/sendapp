import { View } from 'react-native'

const mockSolitoLink = {
  __esModule: true,
  default: jest.fn(),
  useLink: jest.fn(),
  Link: (props) => <View testID={'MockSolitoLink'} {...props} />,
}

module.exports = mockSolitoLink
