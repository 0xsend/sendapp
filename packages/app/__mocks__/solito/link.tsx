import { View } from 'react-native'

const mockSolitoLink = {
  __esModule: true,
  useLink: jest.fn(),
  Link: (props) => <View testID={'MockSolitoLink'} {...props} />,
}

module.exports = mockSolitoLink

export const useLink = mockSolitoLink.useLink
export const Link = mockSolitoLink.Link

export default mockSolitoLink
