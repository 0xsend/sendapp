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
  Spinner,
  LinkableButton,
} from '@my/ui'
import { useCallback, useEffect, useState, useMemo } from 'react'
import { Timer } from '@tamagui/lucide-icons'
import { useGeoBlock } from '../../utils/useOFACGeoBlock'
import {
  useReadBaseJackpotLpPoolTotal,
  useReadBaseJackpotLastJackpotEndTime,
  useReadBaseJackpotRoundDurationInSeconds,
  useReadBaseJackpotTokenDecimals,
} from '@my/wagmi/contracts/base-jackpot'
import { formatUnits } from 'viem'

const GreenSquare = styled(Stack, {
  name: 'Surface',
  w: 11,
  h: 11,
  theme: 'green_active',
  bc: '$background',
})

const zeroTime = { days: 0, hours: 0, minutes: 0, seconds: 0 }

export const JackpotCard = () => {
  const { data: lpPoolTotal, isLoading: isLoadingPoolTotal } = useReadBaseJackpotLpPoolTotal()
  const { data: lastJackpotEndTime, isLoading: isLoadingEndTime } =
    useReadBaseJackpotLastJackpotEndTime()
  const { data: roundDuration, isLoading: isLoadingDuration } =
    useReadBaseJackpotRoundDurationInSeconds()
  const { data: tokenDecimals, isLoading: isLoadingDecimals } = useReadBaseJackpotTokenDecimals()
  const { data: isGeoBlocked, isLoading: isLoadingGeoBlock } = useGeoBlock()

  const jackpotEndTime = useMemo(() => {
    if (lastJackpotEndTime === undefined || roundDuration === undefined) return null
    return (Number(lastJackpotEndTime) + Number(roundDuration)) * 1000
  }, [lastJackpotEndTime, roundDuration])

  const calculateTimeRemaining = useCallback(() => {
    if (!jackpotEndTime) return zeroTime

    const now = Date.now()
    const diff = jackpotEndTime - now

    if (diff <= 0) return zeroTime

    const days = Math.floor(diff / (1000 * 60 * 60 * 24))
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
    const seconds = Math.floor((diff % (1000 * 60)) / 1000)

    return { days, hours, minutes, seconds }
  }, [jackpotEndTime])

  const [timeRemaining, setTimeRemaining] = useState(() => calculateTimeRemaining())

  useEffect(() => {
    if (!jackpotEndTime) {
      setTimeRemaining(zeroTime)
      return
    }

    setTimeRemaining(calculateTimeRemaining())

    const timer = setInterval(() => {
      const remaining = calculateTimeRemaining()
      setTimeRemaining(remaining)
      if (remaining === zeroTime) {
        clearInterval(timer)
      }
    }, 1000)

    return () => clearInterval(timer)
  }, [jackpotEndTime, calculateTimeRemaining])

  const jackpotEndTimeString = useMemo(() => {
    if (!jackpotEndTime) return 'Loading...'
    const date = new Date(jackpotEndTime)
    return date.toLocaleString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      second: '2-digit',
      timeZoneName: 'short',
    })
  }, [jackpotEndTime])

  const formattedJackpotAmount = useMemo(() => {
    if (typeof lpPoolTotal !== 'bigint' || tokenDecimals === undefined) {
      return '...'
    }
    return Number.parseFloat(formatUnits(lpPoolTotal, Number(tokenDecimals))).toLocaleString(
      undefined,
      {
        maximumFractionDigits: 0,
      }
    )
  }, [lpPoolTotal, tokenDecimals])

  const formatNumber = (num: number) => (num < 10 ? `0${num}` : `${num}`)

  const isLoading = isLoadingPoolTotal || isLoadingEndTime || isLoadingDuration || isLoadingDecimals
  const isBuyButtonDisabled = isLoadingGeoBlock || isGeoBlocked

  return (
    <Card
      padding={'$5'}
      w={'100%'}
      jc="space-between"
      $gtLg={{ padding: '$6', height: 'auto', minHeight: 244 }}
      minHeight={184}
    >
      <XStack w={'100%'} zIndex={4} h="100%">
        <YStack gap={'$2'} w={'100%'}>
          <YStack gap={'$2.5'} jc="space-between">
            <XStack ai={'center'} gap="$2.5" width={'100%'}>
              <XStack ai={'center'} gap="$2.5">
                <GreenSquare />
                <Label
                  fontSize={'$4'}
                  zIndex={1}
                  fontWeight={'500'}
                  textTransform={'uppercase'}
                  lineHeight={0}
                  color={'$color10'}
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
            <Paragraph fontSize={'$6'} fontWeight={'500'} zIndex={1} $sm={{ marginTop: '$4' }}>
              SEND
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
                  `${formatNumber(timeRemaining.days)}:${formatNumber(
                    timeRemaining.hours
                  )}:${formatNumber(timeRemaining.minutes)}:${formatNumber(timeRemaining.seconds)}`
                )}
              </H3>
            </XStack>
            <XStack ai="center">
              <Paragraph color="$color10" fontSize="$4" textAlign="left">
                Drawing occurs on: {isLoading ? 'Loading...' : jackpotEndTimeString}
              </Paragraph>
            </XStack>
          </YStack>
          <XStack w="100%" mt="$2">
            <Stack f={1} w="100%" maw={350} gap="$2">
              <LinkableButton
                href="/sendpot/buy-tickets"
                disabled={isBuyButtonDisabled}
                theme={'green'}
                br="$4"
                px={'$3.5'}
                h={'$4.5'}
                key="sendpot-buy-tickets-button"
                animation="200ms"
                enterStyle={{
                  opacity: 0,
                }}
                exitStyle={{
                  opacity: 0,
                }}
              >
                <XStack w={'100%'} ai={'center'} jc="center" h="100%" gap="$2">
                  <LinkableButton.Text
                    fontWeight={'400'}
                    $theme-dark={{ col: '$color0' }}
                    tt="uppercase"
                    size={'$5'}
                  >
                    Buy ticket
                  </LinkableButton.Text>
                </XStack>
              </LinkableButton>
              {isGeoBlocked && (
                <Paragraph color="$red10" fontSize="$3" textAlign="center">
                  Ticket purchases are not available in your region currently.
                </Paragraph>
              )}
            </Stack>
          </XStack>
        </YStack>
      </XStack>
    </Card>
  )
}
