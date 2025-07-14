import {
  Fade,
  H4,
  Paragraph,
  Separator,
  Stack,
  Text,
  XStack,
  YStack,
  type StackProps,
} from '@my/ui'
import { IconX } from 'app/components/icons'
import { IconCoin } from 'app/components/icons/IconCoin'
import { ContractLabels } from 'app/data/contract-labels'
import { ActivityAvatar } from 'app/features/activity/ActivityAvatar'
import {
  isActivitySwapTransfer,
  noteFromActivity,
  useDateDetailsFromActivity,
  useEventNameFromActivity,
  usePhraseFromActivity,
  useSubtextFromActivity,
} from 'app/utils/activity'
import { useAmountFromActivity } from 'app/utils/activity-hooks'
import { useAddressBook } from 'app/utils/useAddressBook'
import { useLiquidityPools } from 'app/utils/useLiquidityPools'
import { useSwapRouters } from 'app/utils/useSwapRouters'
import { type Activity, isSendEarnEvent } from 'app/utils/zod/activity'
import {
  isSendAccountTransfersEvent,
  isSendtagCheckoutEvent,
  isSendTokenUpgradeEvent,
} from 'app/utils/zod/activity/SendAccountTransfersEventSchema'
import { useActivityDetails } from 'app/provider/activity-details'
import { Platform } from 'react-native'

export const ActivityDetails = (props: StackProps) => {
  const { selectedActivity } = useActivityDetails()

  if (!selectedActivity) {
    return null
  }

  return <ActivityDetailsContent activity={selectedActivity} {...props} />
}

const ActivityDetailsContent = ({ activity, ...props }: { activity: Activity } & StackProps) => {
  const { closeActivityDetails } = useActivityDetails()
  const { data: swapRouters } = useSwapRouters()
  const { data: liquidityPools } = useLiquidityPools()
  const activityEventName = useEventNameFromActivity({ activity, swapRouters, liquidityPools })
  const activityPhrase = usePhraseFromActivity({ activity, swapRouters, liquidityPools })
  const subText = useSubtextFromActivity({ activity, swapRouters, liquidityPools })
  const amount = useAmountFromActivity(activity)
  const date = useDateDetailsFromActivity({ activity })
  const note = noteFromActivity(activity)
  const isERC20Transfer = isSendAccountTransfersEvent(activity)
  const addressBook = useAddressBook()
  const isERC20TransferToSendEarn =
    isERC20Transfer && addressBook?.data?.[activity.data.t] === ContractLabels.SendEarn
  const isERC20TransferFromSendEarn =
    isERC20Transfer && addressBook?.data?.[activity.data.f] === ContractLabels.SendEarn

  return (
    <Fade {...props}>
      <YStack w={'100%'} gap={'$3.5'}>
        {Platform.OS === 'web' && (
          <H4 fontWeight={'600'} size={'$7'}>
            Transaction details
          </H4>
        )}
        <YStack
          w={'100%'}
          bg={'$color1'}
          br={'$6'}
          p={'$4'}
          gap={'$3.5'}
          elevation={'$0.75'}
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
                        return <Text>{activityPhrase}</Text>
                      default:
                        return <Text>{subText}</Text>
                    }
                  })()}
                  &nbsp;
                  {(() => {
                    switch (true) {
                      case isSendtagCheckoutEvent(activity):
                        return (
                          <Text
                            color={'$silverChalice'}
                            textTransform={'lowercase'}
                            $theme-light={{
                              color: '$darkGrayTextField',
                            }}
                          >
                            {activityEventName}
                          </Text>
                        )
                      case isSendTokenUpgradeEvent(activity):
                        return null
                      case isActivitySwapTransfer(activity, swapRouters, liquidityPools):
                        return null
                      case isSendEarnEvent(activity):
                        return null
                      case isERC20TransferToSendEarn || isERC20TransferFromSendEarn:
                        return null
                      case !activityPhrase:
                        return null
                      case subText === null:
                        return <Text>{activityPhrase}</Text>
                      default:
                        return (
                          <Text
                            color={'$silverChalice'}
                            textTransform={'lowercase'}
                            $theme-light={{
                              color: '$darkGrayTextField',
                            }}
                          >
                            {activityPhrase}
                          </Text>
                        )
                    }
                  })()}
                </Paragraph>
              </XStack>
            </XStack>
            {Platform.OS === 'web' && (
              <Stack onPress={closeActivityDetails} cursor={'pointer'}>
                <IconX
                  size={'$1.5'}
                  $theme-dark={{ color: '$primary' }}
                  $theme-light={{ color: '$color12' }}
                />
              </Stack>
            )}
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
              <XStack>
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
            <XStack jc={'space-between'} ai={'center'}>
              <Paragraph
                size={'$5'}
                color={'$silverChalice'}
                $theme-light={{
                  color: '$darkGrayTextField',
                }}
              >
                {activityPhrase} on
              </Paragraph>
              <Paragraph
                size={'$5'}
                // @ts-expect-error end value for text-align is valid value, left is not working properly in this case
                ta={'end'}
              >
                {date}
              </Paragraph>
            </XStack>
          </YStack>
        </YStack>
      </YStack>
    </Fade>
  )
}
