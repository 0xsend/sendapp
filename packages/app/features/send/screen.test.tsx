import { describe, expect, it } from '@jest/globals'
import { TamaguiProvider, config } from '@my/ui'
import { render, screen } from '@testing-library/react-native'
import { SendScreen } from './screen'

// jest.mock('app/provider/tag-search')
// jest.mock('app/utils/useProfileLookup')
// jest.mock('@my/wagmi')
describe('SendScreen', () => {
  it.skip('should render search when no recipient', () => {
    // const tree = render(
    //   <TamaguiProvider defaultTheme={'dark'} config={config}>
    //     <SendScreen />
    //   </TamaguiProvider>
    // ).toJSON()
    // expect(tree).toMatchSnapshot()
    // expect(screen.getByText('Search')).toBeOnTheScreen()
  })
})
