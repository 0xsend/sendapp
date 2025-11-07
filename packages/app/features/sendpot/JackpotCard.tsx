import { FadeCard, Paragraph, PrimaryButton, Spinner, XStack, YStack } from '@my/ui'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { CalendarClock, Timer } from '@tamagui/lucide-icons'
import { useGeoBlock } from '../../utils/useOFACGeoBlock'
import {
  useReadBaseJackpotLastJackpotEndTime,
  useReadBaseJackpotLpPoolTotal,
  useReadBaseJackpotRoundDurationInSeconds,
  useReadBaseJackpotTokenDecimals,
} from '@my/wagmi/contracts/base-jackpot'
import { formatUnits } from 'viem'
import { IconCoin } from 'app/components/icons'
import { useRouter } from 'solito/router'

const zeroTime = { days: 0, hours: 0, minutes: 0, seconds: 0 }

export const JackpotCard = () => {
  const { data: lpPoolTotal, isLoading: isLoadingPoolTotal } = useReadBaseJackpotLpPoolTotal()
  const { data: lastJackpotEndTime, isLoading: isLoadingEndTime } =
    useReadBaseJackpotLastJackpotEndTime()
  const { data: roundDuration, isLoading: isLoadingDuration } =
    useReadBaseJackpotRoundDurationInSeconds()
  const { data: tokenDecimals, isLoading: isLoadingDecimals } = useReadBaseJackpotTokenDecimals()
  const { data: isGeoBlocked, isLoading: isLoadingGeoBlock } = useGeoBlock()
  const router = useRouter()

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
    return date.toLocaleString(undefined, {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
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

  const handleOnPress = () => {
    if (isBuyButtonDisabled) {
      return
    }
    router.push('/sendpot/buy-tickets')
  }

  if (isLoading) {
    return <Spinner size={'large'} color={'$color12'} />
  }

  return (
    <FadeCard gap={'$7'} $gtLg={{ p: '$7', gap: '$7' }}>
      <Paragraph fontSize={'$8'} fontWeight="600" $gtLg={{ fontSize: '$9' }}>
        Current Sendpot
      </Paragraph>
      <XStack alignItems={'center'} gap={'$2'} justifyContent={'center'}>
        <Paragraph fontSize={'$11'} fontWeight={600} $gtLg={{ fontSize: '$12' }}>
          {formattedJackpotAmount}
        </Paragraph>
        <IconCoin symbol="SEND" size={'$4'} minWidth={'$4'} />
      </XStack>
      <YStack gap={'$3'}>
        <XStack justifyContent={'space-between'} alignItems={'center'} gap={'$2'} flexWrap={'wrap'}>
          <XStack alignItems={'center'} gap={'$2'}>
            <CalendarClock />
            <Paragraph fontSize={'$5'}>{jackpotEndTimeString}</Paragraph>
          </XStack>
          <XStack alignItems={'center'} gap={'$2'}>
            <Timer />
            <Paragraph fontSize={'$5'}>
              {timeRemaining === zeroTime
                ? '--:--:--:--'
                : `${formatNumber(timeRemaining.days)}:${formatNumber(
                    timeRemaining.hours
                  )}:${formatNumber(timeRemaining.minutes)}:${formatNumber(timeRemaining.seconds)}`}
            </Paragraph>
          </XStack>
        </XStack>
        <PrimaryButton onPress={handleOnPress} disabled={isBuyButtonDisabled}>
          <PrimaryButton.Text>Buy ticket</PrimaryButton.Text>
        </PrimaryButton>
        {isGeoBlocked && (
          <Paragraph color="$error" fontSize="$3" textAlign="center">
            Ticket purchases are not available in your region currently.
          </Paragraph>
        )}
      </YStack>
    </FadeCard>
  )
}
