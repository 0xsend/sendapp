import {
  Label,
  Paragraph,
  XStack,
  YStack,
  Stack,
  BigHeading,
  styled,
  Card,
  H3,
  Spinner, // Added Spinner
  LinkableButton, // Added LinkableButton
} from '@my/ui'
import { useCallback, useEffect, useState, useMemo } from 'react' // Added useCallback
import { Timer } from '@tamagui/lucide-icons'
import { IconTicket } from 'app/components/icons'
// Removed PlayButtons import
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

const zeroTime = { days: 0, hours: 0, minutes: 0, seconds: 0 }

export const JackpotCard = () => {
  // Fetch contract data
  const { data: lpPoolTotal, isLoading: isLoadingPoolTotal } = useReadBaseJackpotLpPoolTotal()
  const { data: lastJackpotEndTime, isLoading: isLoadingEndTime } =
    useReadBaseJackpotLastJackpotEndTime()
  const { data: roundDuration, isLoading: isLoadingDuration } =
    useReadBaseJackpotRoundDurationInSeconds()
  const { data: tokenDecimals, isLoading: isLoadingDecimals } = useReadBaseJackpotTokenDecimals()

  // Calculate next draw time based on contract data
  const jackpotEndTime = useMemo(() => {
    if (lastJackpotEndTime === undefined || roundDuration === undefined) return null
    // Contract times are in seconds, convert to milliseconds
    return (Number(lastJackpotEndTime) + Number(roundDuration)) * 1000
  }, [lastJackpotEndTime, roundDuration])

  // Wrap calculateTimeRemaining in useCallback to stabilize its reference
  const calculateTimeRemaining = useCallback(() => {
    if (!jackpotEndTime) return zeroTime

    const now = Date.now()
    const diff = jackpotEndTime - now

    if (diff <= 0) return zeroTime

    // Calculate days
    const days = Math.floor(diff / (1000 * 60 * 60 * 24))
    // Calculate remaining hours after accounting for days
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
    const seconds = Math.floor((diff % (1000 * 60)) / 1000)

    // Return object now includes days
    return { days, hours, minutes, seconds }
  }, [jackpotEndTime]) // Dependency is jackpotEndTime

  // Use functional update for initial state based on the stable calculateTimeRemaining
  const [timeRemaining, setTimeRemaining] = useState(() => calculateTimeRemaining())

  // Update timer every second
  useEffect(() => {
    if (!jackpotEndTime) {
      setTimeRemaining(zeroTime) // Reset timer if jackpotEndTime becomes invalid
      return // Don't start timer if draw time isn't calculated yet
    }

    // Set initial time immediately when the effect runs or jackpotEndTime changes
    setTimeRemaining(calculateTimeRemaining())

    const timer = setInterval(() => {
      // Use the stable calculateTimeRemaining from the outer scope
      const remaining = calculateTimeRemaining()
      setTimeRemaining(remaining)
      // Optional: Clear interval if time runs out to prevent unnecessary checks
      if (remaining === zeroTime) {
        clearInterval(timer)
      }
    }, 1000)

    return () => clearInterval(timer)
  }, [jackpotEndTime, calculateTimeRemaining]) // Dependencies are correct now

  // Format the jackpot end time string
  const jackpotEndTimeString = useMemo(() => {
    if (!jackpotEndTime) return 'Loading...'
    const date = new Date(jackpotEndTime)
    // Use toLocaleString to include both date and time
    return date.toLocaleString('en-US', {
      weekday: 'short', // e.g., Wed
      month: 'short', // e.g., Mar
      day: 'numeric', // e.g., 31
      hour: 'numeric', // e.g., 12
      minute: '2-digit', // e.g., 35
      second: '2-digit', // e.g., 14
      timeZoneName: 'short', // Optionally add timezone
    })
  }, [jackpotEndTime])

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
        {/* Removed jc={'center'} to allow left alignment */}
        <YStack gap={'$2'} w={'100%'}>
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
                ) : timeRemaining === zeroTime ? (
                  '--:--:--:--'
                ) : (
                  // Update format to DD:HH:SS
                  `${formatNumber(timeRemaining.days)}:${formatNumber(
                    timeRemaining.hours
                  )}:${formatNumber(timeRemaining.minutes)}:${formatNumber(timeRemaining.seconds)}`
                )}
              </H3>
            </XStack>
            {/* Restore the XStack and update the Paragraph, removed centering */}
            <XStack ai="center">
              <Paragraph color="$color10" fontSize="$4" ta="left">
                Drawing occurs on: {isLoading ? 'Loading...' : jackpotEndTimeString}
              </Paragraph>
            </XStack>
          </YStack>

          {/* Buy Ticket Button - Removed centering, using local BuyTicketsButton */}
          <XStack w="100%" mt="$2">
            <Stack f={1} w="100%" maw={350}>
              <LinkableButton
                href="/play/buy-tickets"
                theme={'green'}
                br="$4"
                px={'$3.5'}
                h={'$4.5'}
                key="play-buy-tickets-button"
                animation="200ms"
                enterStyle={{
                  opacity: 0,
                }}
                exitStyle={{
                  opacity: 0,
                }}
              >
                <XStack w={'100%'} ai={'center'} jc="center" h="100%" gap="$2">
                  <IconTicket size={'$1.5'} $theme-dark={{ color: '$color0' }} />
                  <LinkableButton.Text
                    fontWeight={'400'}
                    $theme-dark={{ col: '$color0' }}
                    tt="uppercase"
                    size={'$5'}
                  >
                    Buy /ticket
                  </LinkableButton.Text>
                </XStack>
              </LinkableButton>
            </Stack>
          </XStack>
        </YStack>
      </XStack>
    </Card>
  )
}
