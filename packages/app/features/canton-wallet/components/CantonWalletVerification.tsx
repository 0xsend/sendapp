import { type ReactNode, useCallback, useMemo, useState } from 'react'
import {
  Anchor,
  Button,
  FadeCard,
  Paragraph,
  Spinner,
  SubmitButton,
  useAppToast,
  XStack,
  YStack,
} from '@my/ui'
import { useUser } from 'app/utils/useUser'
import { useSupabase } from 'app/utils/supabase/useSupabase'
import { useSendAccount } from 'app/utils/send-accounts'
import { signChallenge } from 'app/utils/signChallenge'
import { SchemaForm } from 'app/utils/SchemaForm'
import { FormProvider, useForm } from 'react-hook-form'
import { type CantonWalletFormData, CantonWalletSchema } from 'app/utils/zod/cantonWallet'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from 'app/utils/api'
import { bytesToHex, formatUnits, hexToBytes } from 'viem'
import { webauthnCredToAllowedCredentials } from 'app/utils/signUserOp'
import { RecoveryOptions } from '@my/api/src/routers/account-recovery/types'
import { useThemeName } from 'tamagui'
import { Platform } from 'react-native'
import {
  IconBadgeCheckSolid,
  IconDollarCircle,
  IconInfoCircle,
  IconSendSingleLetter,
  IconSlash,
  IconX,
} from 'app/components/icons'
import { Check } from '@tamagui/lucide-icons'
import * as Clipboard from 'expo-clipboard'
import {
  type UseDistributionsResultData,
  useMonthlyDistributions,
  useSnapshotBalance,
} from 'app/utils/distributions'
import { useSendEarnBalancesAtBlock } from 'app/features/earn/hooks'
import { usdcCoin } from 'app/data/coins'
import formatAmount from 'app/utils/formatAmount'
import type { Tables } from '@my/supabase/database.types'
import { useHoverStyles } from 'app/utils/useHoverStyles'
import { useConfirmedTags } from 'app/utils/tags'

const CANTON_WALLET_MIN_SEND_BALANCE = 2000n * BigInt(10 ** 18)

export function CantonWalletVerification() {
  const { profile, isLoading: isUserLoading } = useUser()
  const { data: sendAccount, isLoading: isLoadingSendAccount } = useSendAccount()
  const { data: distributions, isLoading: isLoadingDistributions } = useMonthlyDistributions()
  const distribution = distributions?.[0]
  const isLoading = isLoadingDistributions || isLoadingSendAccount || isUserLoading

  if (isLoading) {
    return <Spinner color="$color12" size="large" alignSelf={'flex-start'} />
  }

  if (!distribution || !sendAccount) {
    return (
      <Paragraph color="$error" size="$5">
        No distribution available
      </Paragraph>
    )
  }

  return (
    <CantonWalletVerificationContent
      profile={profile}
      sendAccount={sendAccount}
      distribution={distribution}
    />
  )
}

interface CantonWalletVerificationContentProps {
  profile: ReturnType<typeof useUser>['profile']
  sendAccount: Tables<'send_accounts'>
  distribution: UseDistributionsResultData[number]
}

function CantonWalletVerificationContent({
  profile,
  sendAccount,
  distribution,
}: CantonWalletVerificationContentProps) {
  const confirmedTags = useConfirmedTags()
  const snapshotBalanceQuery = useSnapshotBalance({
    distribution,
    sendAccount,
  })

  const { data: sendEarnBalances, isLoading: isLoadingSendEarnBalances } =
    useSendEarnBalancesAtBlock(
      distribution.snapshot_block_num ? BigInt(distribution.snapshot_block_num) : null
    )

  const snapshotBalance = snapshotBalanceQuery.data
  const isLoadingSnapshotBalance = snapshotBalanceQuery.isLoading

  const totalAssets = useMemo(
    () => sendEarnBalances?.reduce((sum, { assets }) => sum + assets, 0n) ?? 0n,
    [sendEarnBalances]
  )

  const hasMinSavings = totalAssets >= BigInt(distribution.earn_min_balance)

  const sendTagPurchased = confirmedTags.length > 0

  const cantonWalletAddress = profile?.canton_party_verifications?.canton_wallet_address

  const canConnectCantonWallet = useMemo(() => {
    const hasMinCantonBalance = (snapshotBalance ?? 0n) >= CANTON_WALLET_MIN_SEND_BALANCE
    return sendTagPurchased && hasMinSavings && hasMinCantonBalance
  }, [sendTagPurchased, hasMinSavings, snapshotBalance])

  const minSendBalance = useMemo(() => {
    return formatAmount(
      formatUnits(CANTON_WALLET_MIN_SEND_BALANCE, distribution.token_decimals ?? 18),
      9,
      0
    )
  }, [distribution])

  const minSavingsBalance = useMemo(() => {
    return formatAmount(
      formatUnits(BigInt(distribution.earn_min_balance ?? 0n), usdcCoin.decimals),
      9,
      2
    )
  }, [distribution])

  return (
    <YStack w="100%" gap="$5">
      <Paragraph fontSize={'$7'} fontWeight={'600'} color={'$color12'}>
        Get an invite to Canton Wallet
      </Paragraph>
      <YStack gap="$3.5">
        <VerificationCard
          icon={<IconSlash size={'$1'} color={'$color12'} />}
          label="Sendtag"
          isCompleted={sendTagPurchased}
          isLoading={false}
        />
        <VerificationCard
          icon={<IconDollarCircle size={'$1.5'} color={'$color12'} />}
          label={`Deposit $${minSavingsBalance} to Savings Vault`}
          isCompleted={hasMinSavings}
          isLoading={isLoadingSendEarnBalances}
        />
        <VerificationCard
          icon={<IconSendSingleLetter size={'$1'} color={'$color12'} />}
          label={`Hold ${minSendBalance} $SEND Minimum`}
          isCompleted={(snapshotBalance ?? 0n) >= CANTON_WALLET_MIN_SEND_BALANCE}
          isLoading={isLoadingSnapshotBalance}
        />
        {cantonWalletAddress ? (
          <CantonWalletVerifiedCard address={cantonWalletAddress} />
        ) : canConnectCantonWallet ? (
          <CantonWalletFormCard />
        ) : (
          <CantonWalletPendingCard />
        )}
      </YStack>
    </YStack>
  )
}

interface VerificationCardProps {
  icon: ReactNode
  label: string
  isCompleted: boolean
  isLoading?: boolean
}

function VerificationCard({ icon, label, isCompleted, isLoading }: VerificationCardProps) {
  const hoverStyles = useHoverStyles()

  const statusConfig = {
    completed: {
      icon: <Check size={'$1'} color={'$primary'} $theme-light={{ color: '$color12' }} />,
    },
    pending: {
      icon: <IconInfoCircle color={'$error'} size={'$1.5'} />,
    },
  }

  const { icon: statusIcon } = statusConfig[isCompleted ? 'completed' : 'pending']

  return (
    <FadeCard br={'$6'} flexDirection={'row'} jc={'space-between'} ai={'center'} w={'100%'}>
      <XStack width={'85%'} gap={'$3.5'} alignItems={'center'}>
        <XStack
          w={40}
          h={40}
          ai="center"
          jc="center"
          br="$3"
          backgroundColor={hoverStyles.backgroundColor}
        >
          {icon}
        </XStack>
        <Paragraph size="$5" fontWeight="600" color="$color12">
          {label}
        </Paragraph>
      </XStack>
      <XStack ai={'center'} jc="space-between">
        {isLoading ? <Spinner size="small" /> : statusIcon}
      </XStack>
    </FadeCard>
  )
}

function CantonWalletVerifiedCard({ address }: { address: string }) {
  const toast = useAppToast()
  const hoverStyles = useHoverStyles()

  const copyCantonAddress = useCallback(async () => {
    await Clipboard.setStringAsync(address)
      .then(() => toast.show('Copied Canton Wallet Address'))
      .catch(() => toast.error('Unable to copy'))
  }, [address, toast])

  return (
    <FadeCard br={'$6'} jc={'space-between'} w={'100%'}>
      <XStack justifyContent={'space-between'} alignItems={'center'}>
        <XStack width={'85%'} gap={'$3.5'} alignItems={'center'}>
          <XStack
            w={40}
            h={40}
            ai="center"
            jc="center"
            br="$3"
            backgroundColor={hoverStyles.backgroundColor}
          >
            <IconBadgeCheckSolid size={'$1'} color={'$color12'} />
          </XStack>
          <Paragraph size="$5" fontWeight="600" color="$color12">
            Canton Wallet Verified
          </Paragraph>
        </XStack>
        <XStack ai={'center'} jc="space-between">
          <Check size={'$1'} color={'$primary'} $theme-light={{ color: '$color12' }} />
        </XStack>
      </XStack>
      <Button
        chromeless
        unstyled
        onPress={copyCantonAddress}
        cursor="pointer"
        flex={1}
        hoverStyle={{
          backgroundColor: '$backgroundTransparent',
        }}
        pressStyle={{
          backgroundColor: 'transparent',
        }}
        focusStyle={{
          backgroundColor: 'transparent',
        }}
      >
        <Paragraph style={{ wordBreak: 'break-all' }}>{address}</Paragraph>{' '}
      </Button>
    </FadeCard>
  )
}

function CantonWalletPendingCard() {
  const hoverStyles = useHoverStyles()

  return (
    <FadeCard br={'$6'} flexDirection={'row'} jc={'space-between'} w={'100%'}>
      <XStack width={'85%'} gap={'$3.5'} alignItems={'center'}>
        <XStack
          w={40}
          h={40}
          ai="center"
          jc="center"
          br="$3"
          backgroundColor={hoverStyles.backgroundColor}
        >
          <IconBadgeCheckSolid size={'$1'} color={'$color12'} />
        </XStack>
        <Paragraph size="$5" fontWeight="600" color="$color12">
          Canton Wallet Verified
        </Paragraph>
      </XStack>
      <XStack ai={'center'} jc="space-between">
        <IconInfoCircle color={'$error'} size={'$1.5'} />
      </XStack>
    </FadeCard>
  )
}

function CantonWalletFormCard() {
  const { profile } = useUser()
  const { data: sendAccount } = useSendAccount()
  const supabase = useSupabase()
  const queryClient = useQueryClient()
  const toast = useAppToast()
  const theme = useThemeName()
  const borderColor = theme?.startsWith('dark') ? '$primary' : '$color12'
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const hoverStyles = useHoverStyles()

  const form = useForm<CantonWalletFormData>({
    defaultValues: { address: '' },
  })

  const formAddress = form.watch('address')

  const webauthnCreds = useMemo(
    () =>
      sendAccount?.send_account_credentials
        ?.filter((c) => !!c.webauthn_credentials)
        ?.map((c) => c.webauthn_credentials as NonNullable<typeof c.webauthn_credentials>) ?? [],
    [sendAccount?.send_account_credentials]
  )

  const allowedCredentials = useMemo(
    () => webauthnCredToAllowedCredentials(webauthnCreds),
    [webauthnCreds]
  )

  const { mutateAsync: getChallenge } = api.challenge.getChallenge.useMutation({ retry: false })
  const { mutateAsync: validateSignature } = api.challenge.validateSignature.useMutation({
    retry: false,
  })

  const verifyMutation = useMutation({
    mutationFn: async (data: CantonWalletFormData) => {
      const challengeData = await getChallenge()

      const { encodedWebAuthnSig, accountName, keySlot } = await signChallenge(
        challengeData.challenge as `0x${string}`,
        allowedCredentials
      )

      const encodedWebAuthnSigBytes = hexToBytes(encodedWebAuthnSig)
      const newEncodedWebAuthnSigBytes = new Uint8Array(encodedWebAuthnSigBytes.length + 1)
      newEncodedWebAuthnSigBytes[0] = keySlot
      newEncodedWebAuthnSigBytes.set(encodedWebAuthnSigBytes, 1)

      await validateSignature({
        recoveryType: RecoveryOptions.WEBAUTHN,
        signature: bytesToHex(newEncodedWebAuthnSigBytes),
        challengeId: challengeData.id,
        identifier: `${accountName}.${keySlot}`,
      })

      if (!profile?.id) {
        throw new Error('User not authenticated')
      }

      const { data: result, error } = await supabase
        .from('canton_party_verifications')
        .insert({
          user_id: profile.id,
          canton_wallet_address: data.address,
        })
        .select()
        .single()

      if (error) {
        throw new Error(error.message)
      }

      return result
    },
    onSuccess: () => {
      toast.show('Successfully verified')
      form.reset()
      void queryClient.invalidateQueries({ queryKey: ['profile'] })
    },
    onError: (error) => {
      console.error('Verification failed:', error)
      toast.error('Verification failed')
    },
  })

  const handleVerify = async () => {
    const values = form.getValues()
    const { data, error } = CantonWalletSchema.safeParse(values)

    if (error || !data) {
      setErrorMessage(error?.errors?.[0]?.message ?? 'Invalid input')
      return
    }

    await verifyMutation.mutateAsync(data)
  }

  const handleClearClick = () => {
    form.setValue('address', '')
    setErrorMessage(null)
  }

  return (
    <FadeCard br={'$6'} jc={'space-between'} w={'100%'}>
      <XStack ai="center" gap="$3" w="100%">
        <XStack
          w={40}
          h={40}
          ai="center"
          jc="center"
          br="$3"
          backgroundColor={hoverStyles.backgroundColor}
        >
          <IconBadgeCheckSolid size={'$1'} color={'$color12'} />
        </XStack>
        <Paragraph size="$5" flex={1} fontWeight="600" color="$color12">
          Canton Wallet Verified
        </Paragraph>
        <XStack ai={'center'} jc="space-between">
          <IconInfoCircle color={'$error'} size={'$1.5'} />
        </XStack>
      </XStack>
      <YStack gap="$2" w="100%">
        <FormProvider {...form}>
          <SchemaForm
            form={form}
            onSubmit={handleVerify}
            schema={CantonWalletSchema}
            defaultValues={{ address: '' }}
            props={{
              address: {
                placeholder: 'Enter Canton Wallet Address',
                pr: '$8',
                fontWeight: 'normal',
                br: '$4',
                bw: 0,
                height: 48,
                hoverStyle: {
                  bw: 0,
                },
                '$theme-dark': {
                  placeholderTextColor: '$silverChalice',
                  backgroundColor: '#2b3639',
                },
                '$theme-light': {
                  placeholderTextColor: '$darkGrayTextField',
                  backgroundColor: '#f2f2f2',
                },
                focusStyle: {
                  boc: borderColor,
                  bw: 1,
                  outlineWidth: 0,
                },
                fontSize: 13,
                fieldsetProps: {
                  width: '100%',
                },
                iconAfter: formAddress && (
                  <Button
                    chromeless
                    unstyled
                    cursor={'pointer'}
                    mr={Platform.OS === 'web' ? 0 : '$3'}
                    icon={<IconX color={'$primary'} $theme-light={{ color: '$black' }} size="$1" />}
                    onPress={handleClearClick}
                  />
                ),
              },
            }}
            formProps={{
              width: '100%',
              f: 1,
              $gtSm: {
                maxWidth: '100%',
              },
            }}
          >
            {({ address }) => (
              <>
                <XStack gap="$3" w="100%" ai={'flex-start'}>
                  <XStack w={'70%'}>{address}</XStack>
                  <SubmitButton
                    onPress={handleVerify}
                    width={'30%'}
                    height={44}
                    disabled={verifyMutation.isPending}
                    icon={verifyMutation.isPending ? <Spinner size="small" /> : undefined}
                  >
                    <SubmitButton.Text tt={undefined}>Verify</SubmitButton.Text>
                  </SubmitButton>
                </XStack>
                {errorMessage && <Paragraph color={'$error'}>{errorMessage}</Paragraph>}
              </>
            )}
          </SchemaForm>
        </FormProvider>
      </YStack>
      <Anchor
        href="https://cantonwallet.com/"
        target="_blank"
        rel="noopener noreferrer"
        color="$primary"
        $theme-light={{ color: '$color12' }}
        textAlign="center"
        fontSize={'$5'}
      >
        Create Canton Wallet Account
      </Anchor>
    </FadeCard>
  )
}
