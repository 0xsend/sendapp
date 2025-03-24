import {
  Paragraph,
  XStack,
  YStack,
  Stack,
  Spinner,
  Card,
  H3,
  Input,
  Button,
  useMedia,
  useSafeAreaInsets,
} from '@my/ui'
import { useState } from 'react'
import { useRouter } from 'solito/router'
import { IconGame } from 'app/components/icons'
import { AlertCircle, Timer } from '@tamagui/lucide-icons'
import { TopNav } from 'app/components/TopNav'
import { HomeLayout } from 'app/features/home/layout.web'
import { useCoins } from 'app/provider/coins'
import formatAmount from 'app/utils/formatAmount'

export function BuyTicketsScreen() {
  const router = useRouter()
  const { bottom } = useSafeAreaInsets()
  const media = useMedia()
  const [ticketCount, setTicketCount] = useState('1')
  const [isInputFocused, setIsInputFocused] = useState(false)

  // Get user's SEND balance using the useCoins hook
  const { coins, isLoading } = useCoins()
  const sendCoin = coins.find((coin) => coin.symbol === 'SEND')

  // Calculate total cost
  const ticketPrice = 30 // SEND per ticket
  const totalCost = Number.parseInt(ticketCount || '0') * ticketPrice

  // Format user balance
  const userBalance =
    sendCoin?.balance !== undefined ? Number(sendCoin.balance) / 10 ** sendCoin.decimals : 0
  const insufficientFunds = totalCost > userBalance

  // Get next draw date
  const getNextDrawDate = () => {
    const now = new Date()
    const nextDraw = new Date(now)
    nextDraw.setHours(20, 0, 0, 0)

    if (now > nextDraw) {
      nextDraw.setDate(nextDraw.getDate() + 1)
    }

    return nextDraw.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    })
  }

  const handleBuyTickets = () => {
    // In a real implementation, this would call an API to purchase tickets
    console.log(`Buying ${ticketCount} tickets`)
    router.push('/play')
  }

  const handleCancel = () => {
    router.push('/play')
  }

  return (
    <HomeLayout TopNav={<TopNav header="Buy Send Tickets" showLogo={true} />}>
      <YStack f={1} pb={Math.max(bottom, 24) + 16}>
        <YStack
          px="$4"
          py="$6"
          gap="$6"
          ai="center"
          $gtMd={{
            px: '$6',
            maxWidth: 600,
            mx: 'auto',
          }}
        >
          <Card w="100%" p="$5">
            <YStack gap="$5">
              <YStack gap="$2" ai="center">
                <Paragraph fontSize="$6" ta="center">
                  Each /ticket costs {ticketPrice} SEND. How many tickets would you like to
                  purchase?
                </Paragraph>
                <XStack ai="center" gap="$2">
                  <Timer size="$1" color="$color10" />
                  <Paragraph fontSize="$4" color="$color10" ta="center">
                    Next draw: {getNextDrawDate()} (daily at 8:00 PM)
                  </Paragraph>
                </XStack>
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
                    onChangeText={setTicketCount}
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
                      {isLoading ? (
                        <Spinner size="small" />
                      ) : (
                        <Paragraph
                          color={insufficientFunds ? '$error' : '$color12'}
                          size={'$5'}
                          fontWeight={'600'}
                        >
                          {sendCoin
                            ? formatAmount(
                                (Number(sendCoin.balance) / 10 ** sendCoin.decimals).toString(),
                                10,
                                sendCoin.formatDecimals ?? 5
                              )
                            : '0'}{' '}
                          SEND
                        </Paragraph>
                      )}
                    </XStack>
                    {insufficientFunds && !isLoading && (
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
                <H3 color="$color12">{totalCost} SEND</H3>
              </XStack>
            </YStack>
          </Card>

          <XStack gap="$4" w="100%" mt="$4">
            <Button theme="alt1" onPress={handleCancel} br="$4" px="$4" py="$4" f={1}>
              <Button.Text>Cancel</Button.Text>
            </Button>
            <Button
              theme="green"
              onPress={handleBuyTickets}
              br="$4"
              px="$4"
              py="$4"
              f={2}
              disabled={isLoading || insufficientFunds || totalCost === 0}
              disabledStyle={{ opacity: 0.5 }}
            >
              <Button.Text fontWeight="600">{isLoading ? 'Loading...' : 'Buy Tickets'}</Button.Text>
            </Button>
          </XStack>
        </YStack>
      </YStack>
    </HomeLayout>
  )
}
