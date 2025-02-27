import {
  Paragraph,
  Spinner,
  XStack,
  YStack,
  Stack,
  styled,
  AnimatePresence,
  type XStackProps,
  Card,
} from '@my/ui'
import formatAmount from 'app/utils/formatAmount'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { useEffect, useState } from 'react'
import { type Timer, useStopwatch } from 'react-use-precision-timer'
import { useCoins } from 'app/provider/coins'

const GreenSquare = styled(Stack, {
  name: 'Surface',
  w: 11,
  h: 11,
  theme: 'green_active',
  bc: '$background',
})

const HiddenSquare = styled(Stack, {
  name: 'Surface',
  w: 11,
  h: 11,
  bc: '$color10',
})

export const TokenBalanceCard = () => {
  // @todo add an enabled flag for when hidden
  const { totalPrice, pricesQuery } = useCoins()

  const formattedBalance = formatAmount(totalPrice, 9, 0)
  const { isPriceHidden, toggleIsPriceHidden } = useIsPriceHidden()
  const timer = useStopwatch()
  const { isGameVisible, presses, increaseScore } = useShowHideGame(timer)

  const onShowHidePress = (e) => {
    toggleIsPriceHidden()
    increaseScore()
  }

  return (
    <Card py={'$4'} pl="$5" w={'100%'} jc="space-between" mah={147} $gtSm={{ mih: 147, py: '$5' }}>
      <XStack w={'100%'} zIndex={4} h="100%" onPress={onShowHidePress} cursor="pointer">
        <YStack jc={'center'} gap={'$4'} w={'100%'}>
          <YStack $platform-web={{ w: 'fit-content' }} gap={'$2.5'} jc="space-between">
            <XStack ai={'center'} gap="$2.5" width={'100%'}>
              <AnimatePresence exitBeforeEnter>
                {isPriceHidden ? <HiddenSquare /> : <GreenSquare />}
              </AnimatePresence>
            </XStack>
            {isGameVisible && (
              <XStack w="100%" gap={'$2'} jc={'space-between'} ai={'center'} my="auto">
                <Paragraph fontSize={'$6'} fontWeight={'500'} zIndex={1} color={'$color10'}>
                  {presses}
                </Paragraph>
                <ShowHideGameStopwatch timer={timer} />
              </XStack>
            )}
          </YStack>
          <XStack
            style={{ color: 'white' }}
            gap={'$2.5'}
            overflow-x="scroll"
            pr="$5"
            jc="center"
            $gtSm={{
              mt: 'auto',
              jc: 'flex-start',
            }}
          >
            {(() => {
              switch (true) {
                case isPriceHidden:
                  return (
                    <Paragraph
                      fontSize={'$13'}
                      $sm={{ fontSize: '$12' }}
                      color={'$color12'}
                      fontWeight={'500'}
                      lineHeight={'$10'}
                    >
                      {'//////'}
                    </Paragraph>
                  )
                case pricesQuery.isLoading || !totalPrice:
                  return <Spinner size={'large'} />
                default:
                  return (
                    <XStack ai={'flex-end'} gap={'$1'}>
                      <Paragraph
                        $sm={{
                          fontSize: '$10',
                        }}
                        fontSize={'$11'}
                        color={'$color12'}
                        fontWeight={'700'}
                        lineHeight={'$10'}
                      >
                        $
                      </Paragraph>
                      <Paragraph
                        $sm={{
                          fontSize: formattedBalance.length > 6 ? '$10' : '$13',
                        }}
                        fontSize={'$13'}
                        lineHeight={'$10'}
                        fontWeight={'700'}
                        color={'$color12'}
                        letterSpacing={4}
                      >
                        {formattedBalance}
                      </Paragraph>
                    </XStack>
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
