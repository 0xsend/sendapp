import { Container, Separator, XStack, YStack } from '@my/ui'
import { AccountScreen } from './screen'

export type AccountLayoutProps = {
  /**
   * web-only
   */
  isAccountHome?: boolean
  /**
   * web-only
   */
  children?: React.ReactNode
}

export const AccountLayout = ({ children, isAccountHome = false }: AccountLayoutProps) => {
  // const { isLoading, user } = useUser()
  // if (isLoading || !user) {
  //   return <FullscreenSpinner />
  // }

  return (
    <Container>
      <XStack separator={<Separator vertical />} f={1}>
        <YStack
          backgroundColor="$color1"
          $sm={{ flex: 1, display: isAccountHome ? 'flex' : 'none' }}
          // this file is web-only so we can safely use CSS
          style={{
            transition: '200ms ease width',
          }}
          $gtSm={{
            width: 300,
          }}
          $gtLg={{
            width: 400,
          }}
        >
          <AccountScreen />
        </YStack>
        <YStack my="$10" f={1} ai="center" $sm={{ display: isAccountHome ? 'none' : 'block' }}>
          <YStack width="100%">{children}</YStack>
        </YStack>
      </XStack>
    </Container>
  )
}
