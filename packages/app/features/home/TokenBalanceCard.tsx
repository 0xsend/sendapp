import {
  BigHeading,
  Button,
  Card,
  Paragraph,
  Spinner,
  XStack,
  type XStackProps,
  YStack,
} from '@my/ui'
import formatAmount from 'app/utils/formatAmount'
import { useState } from 'react'
import { type Timer, useStopwatch } from 'react-use-precision-timer'
import { useCoins } from 'app/provider/coins'
import { Eye, EyeOff } from '@tamagui/lucide-icons'
import { useIsPriceHidden } from 'app/features/home/utils/useIsPriceHidden'

export const TokenBalanceCard = () => {
  // @todo add an enabled flag for when hidden
  const { totalPrice, pricesQuery } = useCoins()
  const formattedBalance = formatAmount(totalPrice, 9, 0)
  const { isPriceHidden, toggleIsPriceHidden } = useIsPriceHidden()
  const timer = useStopwatch()
  const { isGameVisible, presses, increaseScore } = useShowHideGame(timer)

  const onShowHidePress = () => {
    toggleIsPriceHidden()
    increaseScore()
  }

  return (
    <Card p={'$5'} w={'100%'} jc="space-between" $gtLg={{ p: '$6', h: 244, mih: 244 }}>
      <XStack w={'100%'} zIndex={4}>
        <YStack jc={'center'} gap={'$5'} w={'100%'} $gtLg={{ gap: '$9' }}>
          <YStack w={'100%'} gap={'$2.5'} jc="space-between">
            <XStack ai={'center'} jc={'space-between'} gap="$2.5" width={'100%'}>
              <Paragraph
                fontSize={'$5'}
                color={'$lightGrayTextField'}
                $theme-light={{ color: '$darkGrayTextField' }}
                zIndex={1}
                $gtLg={{ fontSize: '$6' }}
              >
                Total Balance
              </Paragraph>
              <Button
                chromeless
                backgroundColor="transparent"
                hoverStyle={{ backgroundColor: 'transparent' }}
                pressStyle={{
                  backgroundColor: 'transparent',
                  borderColor: 'transparent',
                }}
                focusStyle={{ backgroundColor: 'transparent' }}
                p={0}
                height={'auto'}
                onPress={toggleIsPriceHidden}
              >
                <Button.Icon>
                  {isPriceHidden ? (
                    <EyeOff
                      size={'$1.5'}
                      color={'$lightGrayTextField'}
                      $theme-light={{ color: '$darkGrayTextField' }}
                    />
                  ) : (
                    <Eye size={'$1.5'} color={'$primary'} $theme-light={{ color: '$color12' }} />
                  )}
                </Button.Icon>
              </Button>
            </XStack>
            {isGameVisible && (
              <XStack gap={'$2'} jc={'space-between'} ai={'center'} my="auto">
                <Paragraph fontSize={'$6'} fontWeight={'500'} zIndex={1} color={'$color10'}>
                  {presses}
                </Paragraph>
                <ShowHideGameStopwatch timer={timer} />
              </XStack>
            )}
          </YStack>
          <XStack style={{ color: 'white' }} gap={'$2.5'} onPress={onShowHidePress}>
            {(() => {
              switch (true) {
                case isPriceHidden:
                  return (
                    <BigHeading
                      $platform-web={{ width: 'fit-content' }}
                      fontWeight={600}
                      color={'$color12'}
                      zIndex={1}
                      $gtSm={{ fontSize: 96, lineHeight: 96 }}
                    >
                      {'///////'}
                    </BigHeading>
                  )
                case pricesQuery.isLoading || !totalPrice:
                  return <Spinner size={'large'} />
                default:
                  return (
                    <>
                      <BigHeading
                        $platform-web={{ width: 'fit-content' }}
                        color={'$color12'}
                        fontSize={'$11'}
                        fontWeight={600}
                        zIndex={1}
                        $gtSm={{
                          fontSize: 96,
                          lineHeight: 96,
                        }}
                      >
                        ${formattedBalance}
                      </BigHeading>
                    </>
                  )
              }
            })()}
          </XStack>
        </YStack>
      </XStack>
    </Card>
  )
}

const useShowHideGame = (timer: Timer) => {
  const countToStop = 100
  const countToVisible = 10

  const [isGameVisible, setIsGameVisible] = useState<boolean>(false)
  const [presses, setPresses] = useState<number>(0)

  const onPress = () => {
    if (!timer.isRunning() && presses < countToStop) {
      timer.start()
      setPresses(presses + 1)
      return
    }

    if (presses >= countToStop) {
      timer.pause()
      return
    }
    if (presses >= countToVisible && !isGameVisible) {
      setIsGameVisible(true)
    }
    setPresses(presses + 1)
  }

  return { isGameVisible, presses, increaseScore: onPress }
}

const ShowHideGameStopwatch = ({ timer, ...props }: XStackProps & { timer: Timer }) => {
  const time = timer.getElapsedRunningTime()
  return (
    <XStack {...props}>
      <Paragraph
        fontSize={'$4'}
        zIndex={1}
        fontWeight={'500'}
        textTransform={'uppercase'}
        lineHeight={0}
        col={'$color10'}
      >
        {`0 + ${Math.floor((time / 60000) % 60)}`.slice(-2)}:
      </Paragraph>
      <Paragraph
        fontSize={'$4'}
        zIndex={1}
        fontWeight={'500'}
        textTransform={'uppercase'}
        lineHeight={0}
        col={'$color10'}
      >
        {`0 + ${Math.floor((time / 1000) % 60)}`.slice(-2)}.
      </Paragraph>
      <Paragraph
        fontSize={'$4'}
        zIndex={1}
        fontWeight={'500'}
        textTransform={'uppercase'}
        lineHeight={0}
        col={'$color10'}
      >
        {`0 + ${Math.floor((time / 10) % 100)}`.slice(-2)}
      </Paragraph>
    </XStack>
  )
}
