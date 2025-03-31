import {
  Paragraph,
  XStack,
  YStack,
  Stack,
  Spinner,
  Card,
  AnimatePresence,
  useMedia,
  type XStackProps,
  useSafeAreaInsets,
} from '@my/ui'
import { useSendAccount } from 'app/utils/send-accounts'
import { JackpotCard } from './JackpotCard'
import { DrawingHistory } from './DrawingHistory'

import { TopNav } from 'app/components/TopNav'
import { HomeLayout } from 'app/features/home/layout.web'

function PlayBody(props: XStackProps) {
  const { bottom } = useSafeAreaInsets()

  return (
    <XStack w={'100%'} $gtLg={{ gap: '$5' }} $lg={{ f: 1, pt: '$3' }} {...props}>
      <YStack
        $gtLg={{ display: 'flex', w: '100%', gap: '$5', pb: 0 }}
        display={'flex'}
        width="100%"
        maxWidth={600} // Add maxWidth for consistency
        gap="$5"
        // ai={'center'} // Removed for left alignment
        pb={Math.max(bottom, 24) + 72} // add mobile bottom button row + 24px
      >
        <JackpotCard />
        {/* Remove ai={'center'} from inner stack as well */}
        <YStack w={'100%'}>
          <Card bc={'$color1'} width="100%" p="$4">
            {/* Use the renamed component */}
            <DrawingHistory />
          </Card>
        </YStack>
      </YStack>
    </XStack>
  )
}

export function PlayScreen() {
  const media = useMedia()
  const { data: sendAccount, isLoading: isSendAccountLoading } = useSendAccount()
  return (
    <HomeLayout TopNav={<TopNav header="Play" showLogo={true} />}>
      <YStack f={1}>
        <AnimatePresence>
          {(() => {
            switch (true) {
              case isSendAccountLoading:
                return (
                  <Stack f={1} h={'100%'} ai={'center'} jc={'center'}>
                    <Spinner size="large" />
                  </Stack>
                )
              case !sendAccount:
                return (
                  <Stack f={1} h={'100%'} ai={'center'} jc={'center'}>
                    <Paragraph theme="red_alt1">No send account found</Paragraph>
                  </Stack>
                )
              default:
                return (
                  <PlayBody
                    key="play-body"
                    animation="200ms"
                    enterStyle={{
                      opacity: 0,
                      y: media.gtLg ? 0 : 300,
                    }}
                    exitStyle={{
                      opacity: 0,
                      y: media.gtLg ? 0 : 300,
                    }}
                  />
                )
            }
          })()}
        </AnimatePresence>
      </YStack>
    </HomeLayout>
  )
}
