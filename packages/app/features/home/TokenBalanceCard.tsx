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
import AsyncStorage from '@react-native-async-storage/async-storage'
import { useEffect, useState } from 'react'
import { type Timer, useStopwatch } from 'react-use-precision-timer'
import { useCoins } from 'app/provider/coins'
import { Eye, EyeOff } from '@tamagui/lucide-icons'

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
    <Card p={'$5'} w={'100%'} jc="space-between" $gtLg={{ p: '$6', h: 244, mih: 244 }} mih={184}>
      <XStack w={'100%'} zIndex={4} h="100%">
        <YStack jc={'center'} gap={'$2'} w={'100%'}>
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
              <XStack w="fit-content" gap={'$2'} jc={'space-between'} ai={'center'} my="auto">
                <Paragraph fontSize={'$6'} fontWeight={'500'} zIndex={1} color={'$color10'}>
                  {presses}
                </Paragraph>
                <ShowHideGameStopwatch timer={timer} />
              </XStack>
            )}
          </YStack>
          <XStack style={{ color: 'white' }} gap={'$2.5'} mt="auto" onPress={onShowHidePress}>
            {(() => {
              switch (true) {
                case isPriceHidden:
                  return (
                    <BigHeading
                      $platform-web={{ width: 'fit-content' }}
                      fontSize={96}
                      lineHeight={'$15'}
                      fontWeight={'600'}
                      color={'$color12'}
                      zIndex={1}
                    >
                      {'//////'}
                    </BigHeading>
                  )
                case pricesQuery.isLoading || !totalPrice:
                  return <Spinner size={'large'} />
                default:
                  return (
                    <>
                      <BigHeading
                        $platform-web={{ width: 'fit-content' }}
                        $sm={{
                          fontSize: (() => {
                            switch (true) {
                              case formattedBalance.length > 8:
                                return '$10'
                              case formattedBalance.length > 5:
                                return '$11'
                              default:
                                return 86
                            }
                          })(),
                        }}
                        fontSize={96}
                        lineHeight={'$15'}
                        color={'$color12'}
                        zIndex={1}
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

const useIsPriceHidden = () => {
  const [isPriceHidden, setIsPriceHidden] = useState<boolean>(true)

  useEffect(() => {
    const getIsPriceHidden = async () => {
      try {
        const savedIsPriceHidden = await AsyncStorage.getItem('isPriceHidden')
        if (savedIsPriceHidden === null) {
          setIsPriceHidden(false)
        }
        if (savedIsPriceHidden !== null) {
          setIsPriceHidden(JSON.parse(savedIsPriceHidden))
        }
      } catch (error) {
        console.error('Error reading isPriceHidden from AsyncStorage:', error)
      }
    }

    getIsPriceHidden()
  }, [])

  const toggleIsPriceHidden = async () => {
    try {
      const newValue = !isPriceHidden
      await AsyncStorage.setItem('isPriceHidden', JSON.stringify(newValue))
      setIsPriceHidden(newValue)
    } catch (error) {
      console.error('Error saving isPriceHidden to AsyncStorage:', error)
    }
  }

  return { isPriceHidden, toggleIsPriceHidden }
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
