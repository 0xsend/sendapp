import {
  Label,
  Paragraph,
  Spinner,
  XStack,
  YStack,
  Stack,
  BigHeading,
  styled,
  AnimatePresence,
} from '@my/ui'
import { EyeOff, Eye } from '@tamagui/lucide-icons'
import formatAmount from 'app/utils/formatAmount'
import { useSendAccountBalances } from 'app/utils/useSendAccountBalances'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { useEffect, useState } from 'react'

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
  const { totalBalance, isLoadingTotalBalance } = useSendAccountBalances()

  const formattedBalance = formatAmount(totalBalance, 9, 0)

  const { isPriceHidden, toggleIsPriceHidden } = useIsPriceHidden()

  return (
    <XStack w={'100%'} zIndex={4}>
      <YStack jc={'center'} gap={'$4'} w={'100%'}>
        <XStack ai={'center'} gap="$2.5" width={'100%'} onPress={toggleIsPriceHidden}>
          <XStack ai={'center'} gap="$2.5">
            <AnimatePresence exitBeforeEnter>
              {isPriceHidden ? <HiddenSquare /> : <GreenSquare />}
            </AnimatePresence>
            <Label
              fontSize={'$4'}
              zIndex={1}
              fontWeight={'500'}
              textTransform={'uppercase'}
              lineHeight={0}
              col={'$color10'}
            >
              Total Balance
            </Label>
          </XStack>
          {isPriceHidden ? (
            <EyeOff color={'$color9'} size={'$1'} />
          ) : (
            <Eye color={'$color11'} size={'$1'} />
          )}
        </XStack>
        <XStack style={{ color: 'white' }} gap={'$2.5'} mt={'$3'}>
          {(() => {
            switch (true) {
              case isPriceHidden:
                return (
                  <BigHeading
                    $platform-web={{ width: 'fit-content' }}
                    fontSize={96}
                    lineHeight={'$15'}
                    fontWeight={'500'}
                    color={'$color12'}
                    zIndex={1}
                  >
                    {'//////'}
                  </BigHeading>
                )
              case isLoadingTotalBalance || !totalBalance:
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
                              return '$11'
                            case formattedBalance.length > 5:
                              return '$12'
                            default:
                              return 96
                          }
                        })(),
                      }}
                      fontSize={96}
                      lineHeight={'$15'}
                      fontWeight={'500'}
                      color={'$color12'}
                      zIndex={1}
                    >
                      {formattedBalance}
                    </BigHeading>
                    <Paragraph fontSize={'$6'} fontWeight={'500'} zIndex={1}>
                      {'USD'}
                    </Paragraph>
                  </>
                )
            }
          })()}
        </XStack>
      </YStack>
    </XStack>
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
