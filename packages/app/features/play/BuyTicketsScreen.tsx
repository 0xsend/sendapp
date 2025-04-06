import {
  Paragraph,
  XStack,
  YStack,
  Spinner,
  Card,
  H3,
  Input,
  Button,
  useToastController,
} from '@my/ui'
import { useState, useMemo, useEffect } from 'react'
import { useRouter } from 'solito/router'
import { createParam } from 'solito'
import {
  useReadBaseJackpotTicketPrice,
  useReadBaseJackpotTokenDecimals,
} from '@my/wagmi/contracts/base-jackpot'
import { formatUnits } from 'viem'
import { useCoin } from 'app/provider/coins'
import formatAmount from 'app/utils/formatAmount'

type BuyTicketsScreenParams = {
  numberOfTickets?: string
}

const { useParam } = createParam<BuyTicketsScreenParams>()

export function BuyTicketsScreen() {
  const router = useRouter()
  const toast = useToastController()
  const [ticketCount, setTicketCount] = useState('1')
  const [isInputFocused, setIsInputFocused] = useState(false)
  const [queryTickets] = useParam('numberOfTickets')

  // Read numberOfTickets from query params
  useEffect(() => {
    if (typeof queryTickets === 'string' && /^\d+$/.test(queryTickets)) {
      const num = Number.parseInt(queryTickets, 10)
      if (num > 0) {
        setTicketCount(queryTickets)
      } else {
        setTicketCount('1')
      }
    }
  }, [queryTickets])

  // --- Fetch Contract Data ---
  const { data: contractTicketPrice, isLoading: isLoadingPrice } = useReadBaseJackpotTicketPrice()
  const { data: tokenDecimals, isLoading: isLoadingDecimals } = useReadBaseJackpotTokenDecimals()

  const { coin: sendCoin, isLoading: isLoadingBalance } = useCoin('SEND')

  // --- Calculations ---
  const ticketPriceBigInt = useMemo(() => contractTicketPrice ?? 0n, [contractTicketPrice])
  const numTickets = useMemo(() => {
    const parsed = Number.parseInt(ticketCount || '0', 10)
    return Number.isNaN(parsed) ? 0n : BigInt(parsed)
  }, [ticketCount])
  const totalCostBigInt = useMemo(() => {
    if (typeof numTickets === 'bigint' && typeof ticketPriceBigInt === 'bigint') {
      return numTickets * ticketPriceBigInt
    }
    return 0n
  }, [numTickets, ticketPriceBigInt])

  // Format user balance
  const userBalanceBigInt = useMemo(() => {
    if (!sendCoin?.balance) return 0n
    try {
      return BigInt(sendCoin.balance)
    } catch {
      return 0n
    }
  }, [sendCoin])

  const isDataLoading =
    isLoadingPrice ||
    isLoadingDecimals ||
    isLoadingBalance ||
    typeof sendCoin?.balance === 'undefined'

  const insufficientFunds = useMemo(
    () => totalCostBigInt > userBalanceBigInt && !isDataLoading,
    [totalCostBigInt, userBalanceBigInt, isDataLoading]
  )

  // // Format display values
  // const displayTicketPrice = useMemo(() => {
  //   if (typeof ticketPriceBigInt !== 'bigint' || tokenDecimals === undefined) return '...'
  //   return formatUnits(ticketPriceBigInt, Number(tokenDecimals))
  // }, [ticketPriceBigInt, tokenDecimals])

  const displayTotalCost = useMemo(() => {
    if (typeof totalCostBigInt !== 'bigint' || tokenDecimals === undefined) return '...'
    return formatUnits(totalCostBigInt, Number(tokenDecimals))
  }, [totalCostBigInt, tokenDecimals])

  // --- Navigation Handler ---
  const handleProceedToConfirm = () => {
    // Basic client-side checks
    if (insufficientFunds) {
      toast.show('Error', { message: 'Insufficient funds.' })
      return
    }
    if (numTickets <= 0n) {
      toast.show('Error', { message: 'Please enter a valid number of tickets.' })
      return
    }
    if (isDataLoading) {
      toast.show('Info', { message: 'Please wait, loading data...' })
      return
    }

    // Navigate to confirmation screen
    router.push({
      pathname: '/play/confirm-buy-tickets',
      query: {
        numberOfTickets: ticketCount,
      },
    })
  }

  return (
    <YStack
      w={'100%'}
      gap="$5"
      pb={'$3.5'}
      jc={'space-between'}
      $gtLg={{
        w: '50%',
      }}
    >
      <Card w="100%" p="$5">
        <YStack gap="$5">
          <YStack gap="$2" ai="center">
            <Paragraph fontSize="$6" ta="center">
              How many tickets would you like to purchase?
            </Paragraph>
          </YStack>

          <YStack
            gap="$5"
            bg={'$color1'}
            br={'$6'}
            p={'$5'}
            borderColor={insufficientFunds ? '$error' : 'transparent'}
            bw={1}
          >
            <XStack ai={'center'} position="relative" jc={'space-between'}>
              <Input
                fontSize="$10"
                color="$color12"
                fontWeight="500"
                bw={0}
                br={0}
                p={1}
                focusStyle={{
                  outlineWidth: 0,
                }}
                placeholder="1"
                fontFamily="$mono"
                inputMode="numeric"
                value={ticketCount}
                onChangeText={(text) => {
                  const numericValue = text.replace(/[^0-9]/g, '')
                  setTicketCount(
                    numericValue.length > 1 && numericValue.startsWith('0')
                      ? numericValue.substring(1)
                      : numericValue || '0'
                  )
                }}
                onFocus={() => setIsInputFocused(true)}
                onBlur={() => setIsInputFocused(false)}
                autoFocus
              />
              <Paragraph fontSize="$6" fontWeight="500" color="$color10">
                Tickets
              </Paragraph>
              <XStack
                position="absolute"
                bottom={-8}
                left={0}
                right={0}
                height={1}
                backgroundColor={isInputFocused ? '$primary' : '$silverChalice'}
                $theme-light={{
                  backgroundColor: isInputFocused ? '$color12' : '$silverChalice',
                }}
              />
            </XStack>

            <XStack jc="space-between" ai={'flex-start'}>
              <YStack>
                <XStack gap={'$2'} ai="center">
                  <Paragraph
                    color={insufficientFunds ? '$error' : '$silverChalice'}
                    size={'$5'}
                    $theme-light={{
                      color: insufficientFunds ? '$error' : '$darkGrayTextField',
                    }}
                  >
                    Balance:
                  </Paragraph>
                  {isDataLoading ? (
                    <Spinner size="small" />
                  ) : (
                    <Paragraph
                      color={insufficientFunds ? '$error' : '$color12'}
                      size={'$5'}
                      fontWeight={'600'}
                    >
                      {sendCoin && tokenDecimals !== undefined
                        ? formatAmount(
                            formatUnits(userBalanceBigInt, Number(tokenDecimals)),
                            10,
                            sendCoin.formatDecimals ?? 5
                          )
                        : '0'}{' '}
                      SEND
                    </Paragraph>
                  )}
                </XStack>
                {insufficientFunds && (
                  <Paragraph color={'$error'} size={'$5'}>
                    Insufficient funds
                  </Paragraph>
                )}
              </YStack>
            </XStack>
          </YStack>

          <XStack jc="space-between" ai="center">
            <Paragraph fontSize="$6" fontWeight="500">
              Total Cost:
            </Paragraph>
            <H3 color="$color12">
              {isDataLoading ? <Spinner size="small" /> : displayTotalCost} SEND
            </H3>
          </XStack>
        </YStack>
      </Card>

      <XStack w="100%" mt="$4">
        <Button
          theme="green"
          onPress={handleProceedToConfirm}
          br="$4"
          px="$4"
          py="$4"
          f={1} // Take full width
          disabled={isDataLoading || insufficientFunds || numTickets <= 0n}
          disabledStyle={{ opacity: 0.5 }}
        >
          <Button.Text ff={'$mono'} fontWeight={'500'} tt="uppercase" size={'$5'} color={'$black'}>
            Review
          </Button.Text>
        </Button>
      </XStack>
    </YStack>
  )
}
