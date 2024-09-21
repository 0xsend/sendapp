import {
  YStack,
  ScrollView,
  Container,
  type ScrollViewProps,
  Stack,
  usePwa,
  LinearGradient,
} from '@my/ui'

import { HomeSideBarWrapper } from 'app/components/sidebar/HomeSideBar'
import { TagSearchProvider } from 'app/provider/tag-search'

import { usePathname } from 'app/utils/usePathname'
import { ActionButtonRow } from './ActionButtonRow'

export function HomeLayout({
  children,
  TopNav,
  ...props
}: {
  children: React.ReactNode
  TopNav?: React.ReactNode
} & ScrollViewProps) {
  const isPwa = usePwa()

  const pathname = usePathname()
  return (
    <HomeSideBarWrapper>
      <TagSearchProvider>
        <ScrollView
          mih="100%"
          contentContainerStyle={{
            mih: '100%',
          }}
          {...props}
        >
          <YStack gap="$3" $gtLg={{ pt: 80 }} w={'100%'}>
            {TopNav}
          </YStack>
          <Container $gtLg={{ pt: '$5', pb: '$0' }}>{children}</Container>
        </ScrollView>
        {pathname === '/' && (
          <Stack
            w={'100%'}
            pb={!isPwa && '$5'}
            px="$4"
            $platform-web={{
              position: 'fixed',
              bottom: 0,
              left: '50%',
              transform: 'translate(-50%, 0)', //center fixed element
            }}
            $gtLg={{ display: 'none' }}
          >
            <LinearGradient
              start={{ x: 0, y: 1 }}
              end={{ x: 0, y: 0 }}
              locations={[0, 0.8]}
              fullscreen
              colors={['transparent', '$background']}
            />
            <ActionButtonRow />
          </Stack>
        )}
      </TagSearchProvider>
    </HomeSideBarWrapper>
  )
}
