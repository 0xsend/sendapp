import { Card, CardProps, H6, Paragraph, Progress, Spinner, Text, XStack, YStack } from '@my/ui'
import { ServerCrash } from '@tamagui/lucide-icons'
import { useActiveDistribution } from 'app/utils/distributions'
import {
  DISTRIBUTION_INITIAL_POOL_AMOUNT,
  useSendDistributionCurrentPoolTotal,
} from 'app/utils/distributions'
import { useTimeRemaining } from 'app/utils/useTimeRemaining'
import React, { useEffect, useState } from 'react'
import { DistributionClaimButton } from './DistributionClaimButton'
import { IconSend } from 'app/components/icons'

export function DistributionsStatCard(cardProps: CardProps) {
  return (
    <Card bg="$background" f={1} $gtMd={{ minWidth: 240, flex: 1, flexBasis: 0 }} {...cardProps}>
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
    <DistributionsStatCard size="$4" br={'$8'} p="$2" {...props}>
      <Card.Header jc="space-between">
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
            <Paragraph theme="alt1" f={3} fontSize={'$5'}>
              Distributed
            </Paragraph>
            <XStack ai="center" space="$2">
              <IconSend size={20} />
              <H6 size="$7" fontWeight={'700'}>
                {distributed}
              </H6>
            </XStack>
          </YStack>
          <YStack
            space="$2"
            f={1}
            w="100%"
            $gtXs={{
              w: '$20',
              alignItems: 'flex-end',
              als: 'flex-end',
            }}
          >
            <Paragraph theme="alt1" f={3} fontSize={'$5'}>
              Total for Send holders
            </Paragraph>
            <XStack ai="center" space="$2">
              <XStack w={20}>
                <IconSend size={20} />
              </XStack>
              <H6 size="$7" fontWeight={'700'}>
                {DISTRIBUTION_INITIAL_POOL_AMOUNT.toLocaleString()}
              </H6>
            </XStack>
          </YStack>
        </XStack>
      </Card.Header>
      <YStack px="$4" jc="flex-start" f={1} zIndex={1}>
        <Progress my="$4" direction="ltr" value={distributionProgress} theme="alt1">
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
      ? now
      : isBeforeQualification
        ? distribution?.qualification_start
        : isDuringQualification
          ? distribution?.qualification_end
          : isClaimable
            ? distribution?.claim_end
            : now
              ? distribution?.qualification_start
              : isDuringQualification
                ? distribution?.qualification_end
                : isClaimable
                  ? distribution?.claim_end
                  : now
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
      br={'$8'}
      p="$2"
      disableOptimization
      {...props}
    >
      <Card.Header f={1} jc="space-between">
        {hasDistribution ? (
          <Paragraph size={'$5'} theme="alt1">
            {subHeader}
          </Paragraph>
        ) : (
          <Paragraph size={'$5'} theme="alt1">
            No Active Distribution
          </Paragraph>
        )}
      </Card.Header>
      <YStack
        px="$2"
        pb="$4"
        space="$2"
        jc="center"
        f={1}
        zIndex={1}
        bc="transparent"
        $gtXs={{ px: '$4' }}
      >
        <YStack space="$4">
          <XStack f={1} space="$2" jc="center" ai="center" w="100%">
            {/* days */}
            <Card
              f={1}
              py="$9"
              w="$6"
              h="$8"
              maw={'$10'}
              zIndex={1}
              bc="$background05"
              bordered
              br={'$6'}
              $gtXs={{
                br: '$8',
              }}
            >
              <YStack ai="center" jc="center" h="100%" position="relative">
                <Text
                  fontWeight="700"
                  f={6}
                  mb="0"
                  fontSize="$9"
                  $gtXs={{
                    fontSize: '$10',
                  }}
                >
                  {String(timeRemaining.days).padStart(2, '0')}
                </Text>
                <Paragraph
                  f={3}
                  color={'$gold9'}
                  size="$3"
                  $gtXs={{
                    size: '$4',
                  }}
                >
                  days
                </Paragraph>
              </YStack>
            </Card>
            <Text mt="$2" fontSize={'$9'} fontWeight={'$16'}>
              :
            </Text>
            {/* hours */}
            <Card
              f={1}
              py="$9"
              w="$6"
              h="$8"
              maw={'$10'}
              zIndex={1}
              bc="$background05"
              bordered
              br={'$6'}
              $gtXs={{
                br: '$8',
              }}
            >
              <YStack ai="center" h="100%" jc="center">
                <Text
                  fontWeight="700"
                  f={6}
                  mb="0"
                  fontSize="$9"
                  $gtXs={{
                    fontSize: '$10',
                  }}
                >
                  {String(timeRemaining.hours).padStart(2, '0')}
                </Text>
                <Paragraph
                  f={3}
                  color={'$gold9'}
                  size="$3"
                  $gtXs={{
                    size: '$4',
                  }}
                >
                  hrs
                </Paragraph>
              </YStack>
            </Card>
            <Text
              fontSize={'$7'}
              fontWeight={'$16'}
              $gtXs={{
                fontSize: '$9',
              }}
            >
              :
            </Text>
            {/* mins */}
            <Card
              f={1}
              py="$9"
              w="$6"
              h="$8"
              maw={'$10'}
              zIndex={1}
              bc="$background05"
              bordered
              br={'$6'}
              $gtXs={{
                br: '$8',
              }}
            >
              <YStack ai="center" h="100%" jc="center">
                <Text
                  fontWeight="700"
                  f={6}
                  mb="0"
                  fontSize="$9"
                  $gtXs={{
                    fontSize: '$10',
                  }}
                >
                  {String(timeRemaining.minutes).padStart(2, '0')}
                </Text>
                <Paragraph
                  f={3}
                  color={'$gold9'}
                  size="$3"
                  $gtXs={{
                    size: '$4',
                  }}
                >
                  min
                </Paragraph>
              </YStack>
            </Card>
            <Text
              fontSize={'$7'}
              fontWeight={'$16'}
              $gtXs={{
                fontSize: '$9',
              }}
            >
              :
            </Text>
            {/* secs */}
            <Card
              f={1}
              py="$9"
              w="$6"
              h="$8"
              maw={'$10'}
              zIndex={1}
              bc="$background05"
              bordered
              br={'$6'}
              $gtXs={{
                br: '$8',
              }}
            >
              <YStack ai="center" h="100%" jc="center">
                <Text
                  fontWeight="700"
                  f={6}
                  mb="0"
                  fontSize="$9"
                  $gtXs={{
                    fontSize: '$10',
                  }}
                >
                  {String(timeRemaining.seconds).padStart(2, '0')}
                </Text>
                <Paragraph
                  f={3}
                  color={'$gold9'}
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
      <YStack px="$4" pb="$4" justifyContent="center" maw={600}>
        <DistributionClaimButton distribution={distribution} />
      </YStack>
    </DistributionsStatCard>
  )
}
