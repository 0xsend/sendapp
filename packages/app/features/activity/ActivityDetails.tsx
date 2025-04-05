import {
  Fade,
  Paragraph,
  Separator,
  Stack,
  XStack,
  YStack,
  Text,
  H4,
  type StackProps,
} from '@my/ui'
import {
  phraseFromActivity,
  amountFromActivity,
  subtextFromActivity,
  isActivitySwapTransfer,
  noteFromActivity,
} from 'app/utils/activity'
import { ActivityAvatar } from 'app/features/activity/ActivityAvatar'
import { IconX } from 'app/components/icons'
import { IconCoin } from 'app/components/icons/IconCoin'
import type { Activity } from 'app/utils/zod/activity'
import {
  isSendtagCheckoutEvent,
  isSendTokenUpgradeEvent,
} from 'app/utils/zod/activity/SendAccountTransfersEventSchema'
import { useSwapRouters } from 'app/utils/useSwapRouters'
import { useLiquidityPools } from 'app/utils/useLiquidityPools'

export const ActivityDetails = ({
  activity,
  onClose,
  ...props
}: {
  activity: Activity
  onClose: () => void
} & StackProps) => {
  const { data: swapRouters } = useSwapRouters()
  const { data: liquidityPools } = useLiquidityPools()
  const activityText = phraseFromActivity(activity, swapRouters, liquidityPools)
  const subText = subtextFromActivity(activity, swapRouters, liquidityPools)
  const amount = amountFromActivity(activity)
  const note = noteFromActivity(activity)

  return (
    <Fade {...props}>
      <YStack w={'100%'} gap={'$3.5'}>
        <H4 fontWeight={'600'} size={'$7'}>
          Transaction details
        </H4>
        <YStack
          w={'100%'}
          bg={'$color1'}
          br={'$6'}
          p={'$4'}
          gap={'$3.5'}
          $gtLg={{
            p: '$7',
          }}
        >
          <XStack ai={'center'} jc={'space-between'}>
            <XStack f={1} gap={'$3'} ai={'center'}>
              <ActivityAvatar activity={activity} size={'$3.5'} br={'unset'} circular={true} />
              <XStack f={1} gap={'$2'}>
                <Paragraph
                  size={'$6'}
                  maxWidth={'100%'}
                  $gtLg={{
                    size: '$7',
                  }}
                >
                  {(() => {
                    switch (true) {
                      case isActivitySwapTransfer(activity, swapRouters, liquidityPools):
                        return <Text>{activityText}</Text>
                      default:
                        return <Text>{subText}</Text>
                    }
                  })()} {(() => {
                    switch (true) {
                      case isSendtagCheckoutEvent(activity):
                        return null
                      case isSendTokenUpgradeEvent(activity):
                        return null
                      case isActivitySwapTransfer(activity, swapRouters, liquidityPools):
                        return null
                      case subText === null:
                        return <Text>{activityText}</Text>
                      default:
                        return (
                          <Text
                            color={'$silverChalice'}
                            textTransform={'lowercase'}
                            $theme-light={{
                              color: '$darkGrayTextField',
                            }}
                          >
                            {activityText}
                          </Text>
                        )
                    }
                  })()}
                </Paragraph>
              </XStack>
            </XStack>
            <Stack onPress={onClose} cursor={'pointer'}>
              <IconX
                size={'$1.5'}
                $theme-dark={{ color: '$primary' }}
                $theme-light={{ color: '$color12' }}
              />
            </Stack>
          </XStack>
          <XStack gap={'$2'} ai={'center'}>
            <Paragraph
              size={'$9'}
              fontWeight={700}
              textTransform={'uppercase'}
              // @ts-expect-error end value for text-align is valid value, left is not working properly in this case
              ta={'end'}
              $gtLg={{
                size: '$10',
              }}
            >
              {amount}
            </Paragraph>
            {activity.data.coin?.symbol && (
              <XStack minWidth={'min-content'}>
                <IconCoin symbol={activity.data.coin.symbol} size={'$2'} />
              </XStack>
            )}
          </XStack>
          {note && (
            <Paragraph size={'$7'} color={'$color10'} w={'100%'} whiteSpace={'pre-wrap'} pl="$3">
              {decodeURIComponent(note)}
            </Paragraph>
          )}
          <Separator px="$4" bw="$0.75" borderRadius={'$4'} />
          <YStack gap={'$2'}>
            <XStack jc={'space-between'}>
              <Paragraph
                size={'$5'}
                color={'$silverChalice'}
                $theme-light={{
                  color: '$darkGrayTextField',
                }}
              >
                {activityText} on
              </Paragraph>
              <Paragraph
                size={'$5'}
                // @ts-expect-error end value for text-align is valid value, left is not working properly in this case
                ta={'end'}
              >
                {activity.created_at.toLocaleString()}
              </Paragraph>
            </XStack>
          </YStack>
        </YStack>
      </YStack>
    </Fade>
  )
}
