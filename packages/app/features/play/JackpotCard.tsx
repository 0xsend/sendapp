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
} from '@my/ui'
import { useEffect, useState } from 'react'
import { Timer } from '@tamagui/lucide-icons'
import { PlayButtons } from './PlayButtons'

const GreenSquare = styled(Stack, {
  name: 'Surface',
  w: 11,
  h: 11,
  theme: 'green_active',
  bc: '$background',
})

export const JackpotCard = () => {
  // Mock data - in a real implementation, this would come from an API
  const jackpotAmount = 250000 // 250,000 SEND

  // Calculate time until next draw (24 hours from now)
  const calculateTimeUntilNextDraw = () => {
    // Get current time
    const now = new Date()

    // Set next draw time to 8:00 PM today
    const nextDraw = new Date(now)
    nextDraw.setHours(20, 0, 0, 0)

    // If it's already past 8:00 PM, set next draw to tomorrow
    if (now > nextDraw) {
      nextDraw.setDate(nextDraw.getDate() + 1)
    }

    // Calculate time difference
    const diff = nextDraw.getTime() - now.getTime()

    // Convert to hours, minutes, seconds
    const hours = Math.floor(diff / (1000 * 60 * 60))
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
    const seconds = Math.floor((diff % (1000 * 60)) / 1000)

    return { hours, minutes, seconds }
  }

  const [timeRemaining, setTimeRemaining] = useState(calculateTimeUntilNextDraw())

  // Format the next draw date
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

  // Simulate countdown timer
  useEffect(() => {
    const timer = setInterval(() => {
      setTimeRemaining(calculateTimeUntilNextDraw())
    }, 1000)

    return () => clearInterval(timer)
  }, [calculateTimeUntilNextDraw])

  const formatNumber = (num: number) => (num < 10 ? `0${num}` : `${num}`)

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
              fontSize={96}
              lineHeight={'$15'}
              fontWeight={'600'}
              color={'$color12'}
              zIndex={1}
            >
              {jackpotAmount.toLocaleString()}
            </BigHeading>
            <Paragraph fontSize={'$6'} fontWeight={'500'} zIndex={1} $sm={{ mt: '$4' }}>
              {'SEND'}
            </Paragraph>
          </XStack>
          <YStack gap="$2" mt="$2">
            <XStack ai="center" gap="$2">
              <Timer size="$1.5" color="$color10" />
              <H3 color="$color10">
                {`${formatNumber(timeRemaining.hours)}:${formatNumber(
                  timeRemaining.minutes
                )}:${formatNumber(timeRemaining.seconds)}`}
              </H3>
            </XStack>
            <XStack ai="center" jc="center">
              <Paragraph color="$color10" fontSize="$4" ta="center">
                Next draw: {getNextDrawDate()} (daily at 8:00 PM)
              </Paragraph>
            </XStack>
            <XStack ai="center" jc="center" mt="$1">
              <Paragraph color="$color10" fontSize="$4" ta="center" fontWeight="500">
                30 SEND per /ticket
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
