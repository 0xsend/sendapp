import {
  Accordion,
  Anchor,
  Card,
  H4,
  H6,
  KVTable,
  Paragraph,
  Separator,
  SizableText,
  Spinner,
  Square,
  TooltipSimple,
  XStack,
  YStack,
} from '@my/ui'
import { PostgrestError } from '@supabase/supabase-js'
import { ChevronDown } from '@tamagui/lucide-icons'
import {
  UseDistributionsResultData,
  useDistributions,
  useSendSellCountDuringDistribution,
} from 'app/utils/distributions'
import formatAmount from 'app/utils/formatAmount'
import { shorten } from 'app/utils/strings'
import { useChainAddresses } from 'app/utils/useChainAddresses'
import { useSendBalance, useSendBalanceOfAt } from 'app/utils/useSendBalance'
import { useTimeRemaining } from 'app/utils/useTimeRemaining'
import { formatUnits } from 'viem'
import { DistributionClaimButton } from './DistributionClaimButton'
import { DistributionsStatCard } from './distribution-stat-cards'

export const DistributionsTable = () => {
  const { data: distributions, isLoading, error } = useDistributions()

  if (isLoading) return <Paragraph>Loading...</Paragraph>
  if (error)
    return <Paragraph>Error loading distributions: {(error as PostgrestError).message}</Paragraph>

  return (
    <YStack space="$4" f={1}>
      {distributions
        ?.sort(({ number: a }, { number: b }) => b - a)
        .map((distribution) => (
          <DistributionInfo distribution={distribution} key={distribution.id} />
        ))}
    </YStack>
  )
}

interface DistributionInfoProps {
  distribution: UseDistributionsResultData[number]
}

const DistributionInfo = ({ distribution }: DistributionInfoProps) => {
  const {
    data: addresses,
    isLoading: isLoadingChainAddresses,
    error: chainAddressesError,
  } = useChainAddresses()
  const shareAmount = distribution.distribution_shares?.[0]?.amount
  const verificationSummary = distribution.distribution_verifications_summary?.[0]
  const {
    data: snapshotBalance,
    isLoading: isLoadingSnapshotBalance,
    error: snapshotBalanceError,
  } = useSendBalanceOfAt({
    address: addresses?.[0]?.address,
    snapshot: distribution.snapshot_id ? BigInt(distribution.snapshot_id) : undefined,
  })
  const {
    data: sendBalanceData,
    isLoading: isLoadingSendBalance,
    error: sendBalanceError,
  } = useSendBalance(addresses?.[0]?.address)
  const {
    data: sells,
    error: sendSellsError,
    isLoading: isSendSellsLoading,
  } = useSendSellCountDuringDistribution(distribution)

  const {
    days: qualificationStartDaysRemaining,
    hours: qualificationStartHoursRemaining,
    minutes: qualificationStartMinutesRemaining,
    seconds: qualificationStartSecondsRemaining,
    diffInMs: qualificationStartDiffInMs,
  } = useTimeRemaining(distribution.qualification_start)

  const {
    days: qualificationEndDaysRemaining,
    hours: qualificationEndHoursRemaining,
    minutes: qualificationEndMinutesRemaining,
    seconds: qualificationEndSecondsRemaining,
    diffInMs: qualificationEndDiffInMs,
  } = useTimeRemaining(distribution.qualification_end)

  const {
    days: claimDaysRemaining,
    hours: claimHoursRemaining,
    minutes: claimMinutesRemaining,
    seconds: claimSecondsRemaining,
    diffInMs: claimDiffInMs,
  } = useTimeRemaining(distribution.claim_end)

  return (
    <DistributionsStatCard w="100%" f={1} $gtMd={{ flexBasis: 'auto' }} br="$8" p="$2">
      {/* Header */}
      <Card.Header gap="$4">
        <XStack gap="$4" fd="column" $gtSm={{ jc: 'space-between', fd: 'row' }}>
          <H6 fontWeight="400" size="$4" theme="alt2">
            Distribution #{distribution.number}
          </H6>
          {qualificationStartDiffInMs > 0 ? (
            <XStack gap="$4">
              <TooltipSimple
                label={`${qualificationStartDaysRemaining} days, ${qualificationStartHoursRemaining} hours, ${qualificationStartMinutesRemaining} minutes, ${qualificationStartSecondsRemaining} seconds`}
              >
                <H6 fontWeight="400" size="$4" theme="alt2">
                  Qualifications start in {qualificationStartDaysRemaining}d{' '}
                  {qualificationStartHoursRemaining}h {qualificationStartMinutesRemaining}m{' '}
                  {qualificationStartSecondsRemaining}s
                </H6>
              </TooltipSimple>
            </XStack>
          ) : null}
          {qualificationEndDiffInMs > 0 ? (
            <XStack gap="$4">
              <TooltipSimple
                label={`${qualificationEndDaysRemaining} days, ${qualificationEndHoursRemaining} hours, ${qualificationEndMinutesRemaining} minutes, ${qualificationEndSecondsRemaining} seconds`}
              >
                <H6 fontWeight="400" size="$4" theme="alt2">
                  Qualifications end in {qualificationEndDaysRemaining}d{' '}
                  {qualificationEndHoursRemaining}h {qualificationEndMinutesRemaining}m{' '}
                  {qualificationEndSecondsRemaining}s
                </H6>
              </TooltipSimple>
            </XStack>
          ) : null}
          {qualificationEndDiffInMs === 0 && claimDiffInMs > 0 ? (
            <XStack gap="$4">
              <TooltipSimple
                label={`${claimDaysRemaining} days, ${claimHoursRemaining} hours, ${claimMinutesRemaining} minutes, ${claimSecondsRemaining} seconds`}
              >
                <H6 fontWeight="400" size="$4" theme="alt2">
                  Claims end in {claimDaysRemaining}d {claimHoursRemaining}h {claimMinutesRemaining}
                  m {claimSecondsRemaining}s
                </H6>
              </TooltipSimple>
            </XStack>
          ) : null}
        </XStack>
        <Separator />
      </Card.Header>
      <KVTable p="$4">
        <KVTable.Row>
          <KVTable.Key w={'33%'}>
            <H4>{qualificationEndDiffInMs > 0 ? 'Potential ' : ''}Rewards</H4>
          </KVTable.Key>
          <KVTable.Value w={'65%'} jc="space-between">
            <TooltipSimple label={`${shareAmount || 0} send`}>
              <H4 color="$gold10">{formatAmount(shareAmount || 0)} send</H4>
            </TooltipSimple>
          </KVTable.Value>
        </KVTable.Row>
        <YStack als="center" w="100%" maxWidth={320}>
          <DistributionClaimButton distribution={distribution} />
        </YStack>
        <Accordion overflow="hidden" type="multiple" w="100%">
          <Accordion.Item value="a1">
            <Accordion.Trigger flexDirection="row" justifyContent="center">
              {({ open }: { open: boolean }) => (
                <>
                  <Square als="center" animation="quick" rotate={open ? '180deg' : '0deg'}>
                    <ChevronDown size="$1" />
                  </Square>
                </>
              )}
            </Accordion.Trigger>
            <Accordion.Content w="100%" f={1}>
              <YStack space="$4" $gtMd={{ fd: 'row' }} w="100%">
                <KVTable f={1}>
                  {distribution.snapshot_id === null ? (
                    <KVTable.Row>
                      <KVTable.Key>
                        <SizableText>Current Balance</SizableText>
                      </KVTable.Key>
                      <KVTable.Value>
                        <YStack w="100%">
                          {isLoadingChainAddresses || isLoadingSendBalance ? (
                            <Spinner color="$color" />
                          ) : chainAddressesError !== null || sendBalanceError !== null ? (
                            <SizableText>
                              Error:{' '}
                              {chainAddressesError
                                ? chainAddressesError.message
                                : sendBalanceError?.message}
                            </SizableText>
                          ) : (
                            <SizableText>
                              {formatAmount(
                                formatUnits(
                                  sendBalanceData?.value ?? BigInt(0),
                                  sendBalanceData?.decimals ?? 0
                                )
                              )}{' '}
                              send
                            </SizableText>
                          )}
                          {Number(sendBalanceData?.value ?? BigInt(0)) <
                            distribution.hodler_min_balance ? (
                            <SizableText>
                              Your balance is below the minimum required to qualify for rewards.{' '}
                              {formatAmount(distribution.hodler_min_balance, 9, 0)} send required.
                              😿
                            </SizableText>
                          ) : null}
                        </YStack>
                      </KVTable.Value>
                    </KVTable.Row>
                  ) : null}
                  {distribution.snapshot_id !== null ? (
                    <KVTable.Row>
                      <KVTable.Key>
                        <SizableText>Snapshot Balance</SizableText>
                      </KVTable.Key>
                      <KVTable.Value>
                        <YStack w="100%">
                          {isLoadingChainAddresses || isLoadingSnapshotBalance ? (
                            <Spinner color="$color" />
                          ) : chainAddressesError !== null || snapshotBalanceError !== null ? (
                            <SizableText>
                              Error:{' '}
                              {chainAddressesError
                                ? chainAddressesError.message
                                : snapshotBalanceError?.message}
                            </SizableText>
                          ) : (
                            <SizableText>
                              {formatAmount(Number(snapshotBalance || 0), 9)} send
                            </SizableText>
                          )}
                          {Number(snapshotBalance || 0) < distribution.hodler_min_balance ? (
                            <SizableText>
                              Your balance is below the minimum required to qualify for rewards.{' '}
                              {formatAmount(distribution.hodler_min_balance, 9, 0)} send required.
                              😿
                            </SizableText>
                          ) : null}
                        </YStack>
                      </KVTable.Value>
                    </KVTable.Row>
                  ) : null}
                  <KVTable.Row>
                    <KVTable.Key>
                      <SizableText>Sells</SizableText>
                    </KVTable.Key>
                    <KVTable.Value>
                      <SizableText>
                        {isSendSellsLoading ? (
                          <Spinner color="$color" />
                        ) : sendSellsError ? (
                          <SizableText>Error: {(sendSellsError as Error).message}</SizableText>
                        ) : sells && sells.length > 0 ? (
                          `${sells.length} made during distribution. Ineligible for rewards. 😿 Use a different wallet next time.`
                        ) : (
                          '0 made during distribution. 😺'
                        )}
                      </SizableText>
                      <YStack>
                        {sells?.map(({ tx_hash }) => (
                          <Anchor
                            key={tx_hash}
                            href={`https://etherscan.io/tx/${tx_hash}`}
                            target="_blank"
                          >
                            {shorten(tx_hash, 8, 3)}
                          </Anchor>
                        ))}
                      </YStack>
                    </KVTable.Value>
                  </KVTable.Row>
                  <KVTable.Row>
                    <KVTable.Key>
                      <SizableText>Referrals</SizableText>
                    </KVTable.Key>
                    <KVTable.Value>
                      <SizableText>
                        {formatAmount(verificationSummary?.tag_referrals || 0, 5, 0)}
                      </SizableText>
                    </KVTable.Value>
                  </KVTable.Row>
                  <KVTable.Row>
                    <KVTable.Key>
                      <SizableText>Tags Registered</SizableText>
                    </KVTable.Key>
                    <KVTable.Value>
                      <SizableText>
                        {formatAmount(verificationSummary?.tag_registrations || 0, 5, 0)}
                      </SizableText>
                    </KVTable.Value>
                  </KVTable.Row>
                  <KVTable.Row>
                    <KVTable.Key>
                      <SizableText>Qualification Start</SizableText>
                    </KVTable.Key>
                    <KVTable.Value>
                      <SizableText>
                        {new Date(distribution.qualification_start).toLocaleDateString()}
                      </SizableText>
                    </KVTable.Value>
                  </KVTable.Row>
                  <KVTable.Row>
                    <KVTable.Key>
                      <SizableText>Qualification End</SizableText>
                    </KVTable.Key>
                    <KVTable.Value>
                      <SizableText>
                        {new Date(distribution.qualification_end).toLocaleDateString()}
                      </SizableText>
                    </KVTable.Value>
                  </KVTable.Row>
                  <KVTable.Row>
                    <KVTable.Key>
                      <SizableText>Claim End</SizableText>
                    </KVTable.Key>
                    <KVTable.Value>
                      <SizableText>
                        {new Date(distribution.claim_end).toLocaleDateString()}
                      </SizableText>
                    </KVTable.Value>
                  </KVTable.Row>
                  <KVTable.Row>
                    <KVTable.Key>
                      <SizableText>Total Pool</SizableText>
                    </KVTable.Key>
                    <KVTable.Value>
                      <TooltipSimple label={`${distribution.amount} send`}>
                        <SizableText>{formatAmount(distribution.amount, 10, 0)}</SizableText>
                      </TooltipSimple>
                    </KVTable.Value>
                  </KVTable.Row>
                  <KVTable.Row>
                    <KVTable.Key>
                      <SizableText>Minimum Balance Required</SizableText>
                    </KVTable.Key>
                    <KVTable.Value>
                      <TooltipSimple label={`${distribution.hodler_min_balance} send`}>
                        <SizableText>
                          {formatAmount(distribution.hodler_min_balance, 10, 0)} send
                        </SizableText>
                      </TooltipSimple>
                    </KVTable.Value>
                  </KVTable.Row>
                </KVTable>
              </YStack>
            </Accordion.Content>
          </Accordion.Item>
        </Accordion>
      </KVTable>
    </DistributionsStatCard>
  )
}
