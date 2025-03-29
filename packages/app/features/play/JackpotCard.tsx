import {
  Label,
  Paragraph,
  XStack,
  YStack,
  Stack,
  BigHeading,
  styled,
  Card,
  H2,
  H3,
  Button,
  Spinner, // Added Spinner
} from '@my/ui'
import { useEffect, useState, useMemo } from 'react' // Added useMemo
import { Timer } from '@tamagui/lucide-icons'
import { PlayButtons } from './PlayButtons'
import {
  useReadBaseJackpotLpPoolTotal,
  useReadBaseJackpotLastJackpotEndTime,
  useReadBaseJackpotRoundDurationInSeconds,
  useReadBaseJackpotTokenDecimals,
} from '@my/wagmi/contracts/base-jackpot' // Corrected import path
import { formatUnits } from 'viem' // Import formatUnits

const GreenSquare = styled(Stack, {
  name: 'Surface',
  w: 11,
  h: 11,
  theme: 'green_active',
  bc: '$background',
})

export const JackpotCard = () => {
  // Fetch contract data
  const { data: lpPoolTotal, isLoading: isLoadingPoolTotal } = useReadBaseJackpotLpPoolTotal()
  const { data: lastJackpotEndTime, isLoading: isLoadingEndTime } =
    useReadBaseJackpotLastJackpotEndTime()
  const { data: roundDuration, isLoading: isLoadingDuration } =
    useReadBaseJackpotRoundDurationInSeconds()
  const { data: tokenDecimals, isLoading: isLoadingDecimals } = useReadBaseJackpotTokenDecimals()

  // Calculate next draw time based on contract data
  const nextDrawTime = useMemo(() => {
    if (lastJackpotEndTime === undefined || roundDuration === undefined) return null
    // Contract times are in seconds, convert to milliseconds
    return (Number(lastJackpotEndTime) + Number(roundDuration)) * 1000
  }, [lastJackpotEndTime, roundDuration])

  // Calculate time remaining until the next draw
  const calculateTimeRemaining = () => {
    if (!nextDrawTime) return { hours: 0, minutes: 0, seconds: 0 }

    const now = Date.now()
    const diff = nextDrawTime - now

    if (diff <= 0) return { hours: 0, minutes: 0, seconds: 0 } // Draw time has passed or is now

    const hours = Math.floor(diff / (1000 * 60 * 60))
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
    const seconds = Math.floor((diff % (1000 * 60)) / 1000)

    return { hours, minutes, seconds }
  }

  const [timeRemaining, setTimeRemaining] = useState(calculateTimeRemaining())

  // Update timer every second
  useEffect(() => {
    if (!nextDrawTime) return // Don't start timer if draw time isn't calculated yet

    const timer = setInterval(() => {
      setTimeRemaining(calculateTimeRemaining())
    }, 1000)

    return () => clearInterval(timer)
  }, [nextDrawTime, calculateTimeRemaining]) // Added calculateTimeRemaining to dependencies

  // Format the next draw date string
  const nextDrawDateString = useMemo(() => {
    if (!nextDrawTime) return 'Loading...'
    const date = new Date(nextDrawTime)
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    })
  }, [nextDrawTime])

  // Format jackpot amount (using lpPoolTotal as placeholder)
  const formattedJackpotAmount = useMemo(() => {
    // Ensure lpPoolTotal is a bigint and tokenDecimals is loaded
    if (typeof lpPoolTotal !== 'bigint' || tokenDecimals === undefined) {
      return '...' // Show loading state
    }
    // Assuming lpPoolTotal represents the jackpot amount for display
    return Number.parseFloat(formatUnits(lpPoolTotal, Number(tokenDecimals))).toLocaleString(
      undefined,
      {
        maximumFractionDigits: 0, // Display as whole number
      }
    )
  }, [lpPoolTotal, tokenDecimals])

  const formatNumber = (num: number) => (num < 10 ? `0${num}` : `${num}`)

  const isLoading = isLoadingPoolTotal || isLoadingEndTime || isLoadingDuration || isLoadingDecimals

  return (
    <Card p={'$5'} w={'100%'} jc="space-between" $gtLg={{ p: '$6', h: 'auto', mih: 244 }} mih={184}>
      <XStack w={'100%'} zIndex={4} h="100%">
        <YStack jc={'center'} gap={'$2'} w={'100%'}>
          <YStack w="fit-content" gap={'$2.5'} jc="space-between">
            <XStack ai={'center'} gap="$2.5" width={'100%'}>
              <XStack ai={'center'} gap="$2.5">
                <GreenSquare />
                <Label
                  fontSize={'$4'}
                  zIndex={1}
                  fontWeight={'500'}
                  textTransform={'uppercase'}
                  lineHeight={0}
                  col={'$color10'}
                >
                  Current Sendpot
                </Label>
              </XStack>
            </XStack>
          </YStack>
          <XStack style={{ color: 'white' }} gap={'$2.5'} mt="auto">
            <BigHeading
              $platform-web={{ width: 'fit-content' }}
              fontSize={64}
              $gtSm={{ fontSize: 80 }}
              $gtMd={{ fontSize: 96 }}
              lineHeight={'$15'}
              fontWeight={'600'}
              color={'$color12'}
              zIndex={1}
            >
              {isLoading ? <Spinner /> : formattedJackpotAmount}
            </BigHeading>
            <Paragraph fontSize={'$6'} fontWeight={'500'} zIndex={1} $sm={{ mt: '$4' }}>
              {/* Assuming the token is always SEND, otherwise fetch token symbol */}
              {'SEND'}
            </Paragraph>
          </XStack>
          <YStack gap="$2" mt="$2">
            <XStack ai="center" gap="$2">
              <Timer size="$1.5" color="$color10" />
              <H3 color="$color10">
                {isLoading ? (
                  <Spinner size="small" />
                ) : (
                  `${formatNumber(timeRemaining.hours)}:${formatNumber(
                    timeRemaining.minutes
                  )}:${formatNumber(timeRemaining.seconds)}`
                )}
              </H3>
            </XStack>
            <XStack ai="center" jc="center">
              <Paragraph color="$color10" fontSize="$4" ta="center">
                Next draw: {isLoading ? 'Loading...' : nextDrawDateString}
              </Paragraph>
            </XStack>
          </YStack>

          {/* Buy Ticket Button */}
          <XStack w="100%" jc="center" mt="$4">
            <Stack f={1} w="100%" jc={'center'} maw={350}>
              <PlayButtons.BuyTicketsButton href="/play/buy-tickets" />
            </Stack>
          </XStack>
        </YStack>
      </XStack>
    </Card>
  )
}
