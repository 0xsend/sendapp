import { Card, CardProps, Paragraph, Progress, Spinner, XStack, YStack, H6 } from '@my/ui'
import { useActiveDistribution } from 'app/utils/distributions'
import React, { useEffect, useState } from 'react'
import { ServerCrash } from '@tamagui/lucide-icons'
import {
  useSendDistributionCurrentPoolTotal,
  DISTRIBUTION_INITIAL_POOL_AMOUNT,
} from 'app/utils/distributions'
import { IconSendToken } from 'app/components/icons/IconSendToken'
import { useTimeRemaining } from 'app/utils/useTimeRemaining'
import { DistributionClaimButton } from './DistributionClaimButton'

export function DistributionsStatCard(cardProps: CardProps) {
  return (
    <Card theme="gold" f={1} $gtMd={{ minWidth: 240, flex: 1, flexBasis: 0 }} {...cardProps}>
      {cardProps.children}
    </Card>
  )
}

export function DistributionProgressCard(props: CardProps) {
  const { data: sendTotalDistPool, isError, error } = useSendDistributionCurrentPoolTotal()
  const [distributed, setDistributed] = useState(DISTRIBUTION_INITIAL_POOL_AMOUNT.toLocaleString())
  const [distributionProgress, setDistributionProgress] = useState(0)
  useEffect(() => {
    if (!sendTotalDistPool) return
    const _distributed = DISTRIBUTION_INITIAL_POOL_AMOUNT - sendTotalDistPool.value
    setDistributed(_distributed.toLocaleString())
    setDistributionProgress(
      Number((BigInt(_distributed) * BigInt(100)) / DISTRIBUTION_INITIAL_POOL_AMOUNT)
    )
  }, [sendTotalDistPool])

  return (
    <DistributionsStatCard size="$4" {...props}>
      <Card.Header jc="space-between">
        <H6 fontWeight="400" size="$4" theme="alt2">
          Total Distributions
        </H6>
      </Card.Header>
      <YStack px="$4" jc="flex-start" f={1} zIndex={1}>
        <XStack
          space="$4"
          mx="auto"
          w="100%"
          flexDirection="column"
          alignItems="stretch"
          $gtXs={{
            flexDirection: 'row',
          }}
        >
          <YStack
            space="$2"
            f={1}
            w="100%"
            $gtXs={{
              w: '50%',
            }}
          >
            <Paragraph theme="alt1" f={3}>
              Distributed
            </Paragraph>
            <XStack ai="center" space="$2">
              <IconSendToken size={20} />
              <H6 size="$6">{distributed}</H6>
            </XStack>
          </YStack>
          <YStack
            space="$2"
            f={1}
            w="100%"
            $gtXs={{
              w: '$20',
              als: 'flex-end',
            }}
          >
            <Paragraph theme="alt1" f={3}>
              Total for Send holders
            </Paragraph>
            <XStack ai="center" space="$2">
              <XStack w={20}>
                <IconSendToken size={20} />
              </XStack>
              <H6 size="$6">{DISTRIBUTION_INITIAL_POOL_AMOUNT.toLocaleString()}</H6>
            </XStack>
          </YStack>
        </XStack>
        <Progress backgroundColor={'$color3'} my="$4" direction="ltr" value={distributionProgress}>
          <Progress.Indicator animation="quick" />
        </Progress>
        {isError ? (
          <H6 size="$4" f={6} color="$orange11">
            Error: {error?.message}
          </H6>
        ) : null}
      </YStack>
    </DistributionsStatCard>
  )
}

export function DistributionTimeCard(props: CardProps) {
  const { distribution, isLoading, error } = useActiveDistribution()

  const now = new Date()
  const hasDistribution = !isLoading && distribution

  const isBeforeQualification = hasDistribution && now < distribution.qualification_start
  const isDuringQualification =
    hasDistribution &&
    now >= distribution.qualification_start &&
    now <= distribution.qualification_end
  const isClaimable =
    hasDistribution && now > distribution.qualification_end && now <= distribution.claim_end
  const isPastClaimEnd = hasDistribution && now > distribution.claim_end

  const timeRemaining = useTimeRemaining(
    isLoading
      ? new Date()
      : isBeforeQualification
      ? distribution?.qualification_start
      : isDuringQualification
      ? distribution?.qualification_end
      : isClaimable
      ? distribution?.claim_end
      : new Date()
  )

  if (isLoading) {
    return (
      <DistributionsStatCard {...props}>
        <YStack p="$4" ai="center" jc="center" f={1} zIndex={1} bc="transparent">
          <Spinner color="$color" />
        </YStack>
      </DistributionsStatCard>
    )
  }

  if (error) {
    return (
      <DistributionsStatCard {...props}>
        <YStack p="$4" ai="center" jc="center" f={1} zIndex={1} bc="transparent">
          <ServerCrash opacity={0.5} />
          <Paragraph theme="alt2">Something went wrong. Please come back later.</Paragraph>
        </YStack>
      </DistributionsStatCard>
    )
  }

  if (!hasDistribution) {
    return (
      <DistributionsStatCard {...props}>
        <YStack p="$4" ai="center" jc="center" f={1} zIndex={1} bc="transparent">
          <Paragraph theme="alt2">No Active Distribution</Paragraph>
        </YStack>
      </DistributionsStatCard>
    )
  }

  let subHeader = ''
  let dateToShow = new Date()

  if (isBeforeQualification) {
    subHeader = 'Opens In'
    dateToShow = distribution.qualification_start
  } else if (isDuringQualification) {
    subHeader = 'Closes In'
    dateToShow = distribution.qualification_end
  } else if (isClaimable) {
    subHeader = 'Claim Ends In'
    dateToShow = distribution.claim_end
  } else if (isPastClaimEnd) {
    subHeader = 'Claim Period Ended'
  }

  return (
    <DistributionsStatCard
      accessibilityLabel={`${subHeader} ${dateToShow.toLocaleDateString()}`}
      size="$4"
      disableOptimization
      {...props}
    >
      <Card.Header f={1} jc="space-between">
        <H6 fontWeight="400" size="$4" theme="alt2">
          Distribution {isLoading ? <Spinner color="$color" /> : distribution.number}
        </H6>
      </Card.Header>
      <YStack px="$4" pb="$4" space="$2" jc="center" f={1} zIndex={1} bc="transparent">
        {hasDistribution ? (
          <Paragraph>{subHeader}</Paragraph>
        ) : (
          <Paragraph>No Active Distribution</Paragraph>
        )}
        <YStack space="$6">
          <XStack f={1} space="$2" ai="center" w="100%">
            {/* days */}
            <Card f={1} py="$4" w="$6" h="$8" zIndex={1} bc="transparent" bordered>
              <YStack ai="center" jc="center">
                <Paragraph
                  fontWeight="700"
                  f={6}
                  mb="0"
                  size="$8"
                  lineHeight="$4"
                  $gtXs={{
                    size: '$8',
                    lineHeight: '$4',
                  }}
                >
                  {String(timeRemaining.days).padStart(2, '0')}
                </Paragraph>
                <Paragraph
                  f={3}
                  mt="$2"
                  size="$3"
                  $gtXs={{
                    size: '$4',
                  }}
                >
                  days
                </Paragraph>
              </YStack>
            </Card>
            {/* hours */}
            <Card f={1} py="$4" w="$6" h="$8" zIndex={1} bc="transparent" bordered>
              <YStack ai="center" jc="center">
                <Paragraph
                  fontWeight="700"
                  f={6}
                  mb="0"
                  size="$8"
                  lineHeight="$4"
                  $gtXs={{
                    size: '$8',
                    lineHeight: '$4',
                  }}
                >
                  {String(timeRemaining.hours).padStart(2, '0')}
                </Paragraph>
                <Paragraph
                  f={3}
                  mt="$2"
                  size="$3"
                  $gtXs={{
                    size: '$4',
                  }}
                >
                  hrs
                </Paragraph>
              </YStack>
            </Card>
            {/* mins */}
            <Card f={1} py="$4" w="$6" h="$8" zIndex={1} bc="transparent" bordered>
              <YStack ai="center" jc="center">
                <Paragraph
                  fontWeight="700"
                  f={6}
                  mb="0"
                  size="$8"
                  lineHeight="$4"
                  $gtXs={{
                    size: '$8',
                    lineHeight: '$4',
                  }}
                >
                  {String(timeRemaining.minutes).padStart(2, '0')}
                </Paragraph>
                <Paragraph
                  f={3}
                  mt="$2"
                  size="$3"
                  $gtXs={{
                    size: '$4',
                  }}
                >
                  min
                </Paragraph>
              </YStack>
            </Card>
            {/* secs */}
            <Card f={1} py="$4" w="$6" h="$8" zIndex={1} bc="transparent" bordered>
              <YStack ai="center" jc="center">
                <Paragraph
                  fontWeight="700"
                  f={6}
                  mb="0"
                  size="$8"
                  lineHeight="$4"
                  $gtXs={{
                    size: '$8',
                    lineHeight: '$4',
                  }}
                >
                  {String(timeRemaining.seconds).padStart(2, '0')}
                </Paragraph>
                <Paragraph
                  f={3}
                  mt="$2"
                  size="$3"
                  $gtXs={{
                    size: '$4',
                  }}
                >
                  sec
                </Paragraph>
              </YStack>
            </Card>
          </XStack>
        </YStack>
      </YStack>
      <YStack px="$4" pb="$4" justifyContent="center">
        <DistributionClaimButton distribution={distribution} />
      </YStack>
    </DistributionsStatCard>
  )
}
