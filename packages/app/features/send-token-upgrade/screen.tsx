import {
  Button,
  Card,
  Fade,
  H1,
  H4,
  Link,
  Paragraph,
  ScrollView,
  Spinner,
  Stack,
  Theme,
  useAppToast,
  XStack,
  YStack,
} from '@my/ui'
import {
  sendBaseMainnetBundlerClient,
  baseMainnetClient,
  entryPointAddress,
  sendTokenAddress,
  sendTokenV0Address,
  sendTokenV0LockboxAbi,
  sendTokenV0LockboxAddress,
  sendVerifyingPaymasterAddress,
  useReadSendTokenV0BalanceOf,
} from '@my/wagmi'
import { useQueryClient } from '@tanstack/react-query'
import { IconSendLogo, IconUpgrade } from 'app/components/icons'
import { sendCoin } from 'app/data/coins'
import { api } from 'app/utils/api'
import { assert } from 'app/utils/assert'
import formatAmount from 'app/utils/formatAmount'
import { useSendAccount } from 'app/utils/send-accounts'
import { signUserOp } from 'app/utils/signUserOp'
import { toNiceError } from 'app/utils/toNiceError'
import { useUserOp } from 'app/utils/userop'
import { useSendAccountBalances } from 'app/utils/useSendAccountBalances'
import { useMemo, useState } from 'react'
import { encodeFunctionData, erc20Abi, withRetry } from 'viem'
import { useTranslation } from 'react-i18next'
import { useAnalytics } from 'app/provider/analytics'

interface TokenBalanceRowProps {
  label: string
  amount: string
}

function TokenBalanceRow({ label, amount }: TokenBalanceRowProps) {
  return (
    <XStack w="100%" ai="center" jc="space-between">
      <XStack ai="center" gap="$2">
        <Theme name="green">
          <Stack w={16} h={16} br="$2" bc="$color8" />
        </Theme>
        <H4 color="$color11">{label}</H4>
      </XStack>
      <Paragraph fontSize="$6" fontWeight="600">
        {amount} SEND
      </Paragraph>
    </XStack>
  )
}

/**
 * Screen for the Send V0 Token Upgrade. It shows a button to upgrade the user's Send V0 Token balance.
 *
 * This upgrade is required because the Send V0 Token has 0 decimals and a 100B supply.
 * The process for upgrading requires the user to approve the Send V0 Token and deposit it into the Send V0 Lockbox.
 * The lockbox acts as a burn address for the Send V0 Token. Once the transfer
 * to the lockbox is complete, Send V1 token is minted at a 100:1 ratio since the Send V1 Token has 1B supply.
 *
 * This should always be shown to the user if they have Send V0 Tokens.
 *
 * @note we refetch the balance not too often but at least once when the user opens the screen
 * and when the user opens the screen again. Consider adding a refetchInterval if we find users are able to
 * use the app and they have Send V0 Tokens.
 * @param children - The children to render when the upgrade is not required.
 * @returns The children if the upgrade is required, otherwise it render the upgrade button.
 */
export function SendV0TokenUpgradeScreen({ children }: { children?: React.ReactNode }) {
  const chainId = baseMainnetClient.chain.id
  const { data: sendAccount } = useSendAccount()
  const { t } = useTranslation('sendTokenUpgrade')
  const {
    data: balance,
    isPending,
    isError,
  } = useReadSendTokenV0BalanceOf({
    chainId,
    args: [sendAccount?.address ?? '0x'],
    query: {
      enabled: !!sendAccount?.address,
    },
  })
  const isUpgradeRequired = !isPending && !isError && balance > BigInt(0)

  if (!isUpgradeRequired) {
    return children
  }

  return (
    <ScrollView
      contentContainerStyle={{ alignItems: 'center', gap: '$6', paddingVertical: '$8' }}
      w="100%"
      maw="100%"
      mih={600}
      overScrollMode={'never'}
      f={1}
    >
      <IconSendLogo size="$8" color="$color12" mx="auto" />
      <Fade f={1} ai="center" jc="center" gap="$6" w="100%" maw="100%" h="100%" mt="$12">
        <YStack f={1} ai="center" jc="center" px="$4" gap="$6" w="100%" maw="100%">
          <Stack mb="$2">
            <IconUpgrade size="$6" color={'$primary'} $theme-light={{ color: '$color12' }} />
          </Stack>

          <YStack ai="center" gap="$2">
            <H1 fontWeight="800" tt="uppercase">
              {t('hero.title')}
            </H1>
            <Paragraph color="$color10" ta="center" fontSize="$6" maw={400}>
              {t('hero.subtitle')}
            </Paragraph>
          </YStack>

          <Card w="100%" maw={500} p="$5" gap="$4">
            <TokenBalanceRow
              label={t('balances.current')}
              amount={formatAmount(balance.toString(), 9, sendCoin.formatDecimals)}
            />
            <TokenBalanceRow
              label={t('balances.after')}
              amount={formatAmount((balance / 100n).toString(), 9, sendCoin.formatDecimals)}
            />
          </Card>

          <YStack gap="$4" w="100%" maw={500} ai="center">
            <UpgradeTokenButton />

            <Link
              href="https://info.send.it/send-docs/send-token/send-v1-tokenomics"
              target="_blank"
            >
              <Paragraph
                fontSize="$4"
                textDecorationLine="underline"
                color={'$primary'}
                $theme-light={{ color: '$color12' }}
              >
                {t('links.docs')}
              </Paragraph>
            </Link>
          </YStack>
        </YStack>
      </Fade>
    </ScrollView>
  )
}

function UpgradeTokenButton() {
  const chainId = baseMainnetClient.chain.id
  const { data: sendAccount } = useSendAccount()
  const sender = useMemo(() => sendAccount?.address, [sendAccount?.address])
  const webauthnCreds = useMemo(
    () =>
      sendAccount?.send_account_credentials
        .filter((c) => !!c.webauthn_credentials)
        .map((c) => c.webauthn_credentials as NonNullable<typeof c.webauthn_credentials>) ?? [],
    [sendAccount?.send_account_credentials]
  )
  const sendTokenV0Bal = useReadSendTokenV0BalanceOf({
    chainId,
    args: [sender ?? '0x'],
    query: { enabled: !!sender },
  })
  const { tokensQuery } = useSendAccountBalances()
  const [userOpStateKey, setUserOpStateKey] = useState<string | null>(null)
  const { t } = useTranslation('sendTokenUpgrade')
  const analytics = useAnalytics()

  const calls = useMemo(
    () => [
      {
        dest: sendTokenV0Address[chainId],
        value: 0n,
        data: encodeFunctionData({
          abi: erc20Abi,
          functionName: 'approve',
          args: [sendTokenV0LockboxAddress[chainId], sendTokenV0Bal.data ?? 0n],
        }),
      },
      {
        dest: sendTokenV0LockboxAddress[chainId],
        value: 0n,
        data: encodeFunctionData({
          abi: sendTokenV0LockboxAbi,
          functionName: 'deposit',
          args: [sendTokenV0Bal.data ?? 0n],
        }),
      },
    ],
    [sendTokenV0Bal.data, chainId]
  )

  const paymasterSign = api.sendAccount.paymasterSign.useMutation({
    onMutate: () => {
      setUserOpStateKey('requesting')
      // Track token upgrade started
      analytics.capture({
        name: 'token_upgrade_started',
        properties: {
          from_token_address: sendTokenV0Address[chainId],
          to_token_address: sendTokenAddress[chainId],
          amount: sendTokenV0Bal.data?.toString(),
        },
      })
    },
    onSuccess: async (data) => {
      assert(uop.isSuccess, 'uop is not success')

      // assign paymasterData to the userOp
      uop.data.paymasterData = data.paymasterData

      // sign the userOp
      uop.data.signature = await signUserOp({
        userOp: uop.data,
        webauthnCreds,
        chainId: baseMainnetClient.chain.id,
        entryPoint: entryPointAddress[baseMainnetClient.chain.id],
      })

      setUserOpStateKey('sending')

      const userOpHash = await sendBaseMainnetBundlerClient.sendUserOperation({
        userOperation: uop.data,
      })

      setUserOpStateKey('waiting')

      const receipt = await withRetry(
        () =>
          sendBaseMainnetBundlerClient.waitForUserOperationReceipt({
            hash: userOpHash,
            timeout: 10_000,
          }),
        {
          delay: 100,
          retryCount: 3,
        }
      )

      assert(receipt.success, 'receipt status is not success')

      // Track token upgrade completed
      analytics.capture({
        name: 'token_upgrade_completed',
        properties: {
          from_token_address: sendTokenV0Address[chainId],
          to_token_address: sendTokenAddress[chainId],
          amount: sendTokenV0Bal.data?.toString(),
          tx: {
            chain_id: chainId,
            tx_hash: receipt.receipt.transactionHash,
            userop_hash: userOpHash,
            gas_sponsored: true,
            gas_payer: 'paymaster',
            paymaster_flow: 'send',
          },
        },
      })

      toast.show(t('toast.success'))
    },
    onError: (error) => {
      // Track token upgrade failed
      analytics.capture({
        name: 'token_upgrade_failed',
        properties: {
          from_token_address: sendTokenV0Address[chainId],
          to_token_address: sendTokenAddress[chainId],
          amount: sendTokenV0Bal.data?.toString(),
          error_type: 'unknown',
        },
      })
    },
    onSettled() {
      queryClient.invalidateQueries({ queryKey: tokensQuery.queryKey })
      queryClient.invalidateQueries({ queryKey: sendTokenV0Bal.queryKey })
      setUserOpStateKey(null)
    },
  })

  const uop = useUserOp({
    paymaster: sendVerifyingPaymasterAddress[chainId],
    paymasterVerificationGasLimit: 200000n,
    paymasterPostOpGasLimit: 200000n,
    paymasterData: paymasterSign.data?.paymasterData,
    callGasLimit: 150000n,
    sender,
    calls,
  })

  const toast = useAppToast()
  const queryClient = useQueryClient()

  const canSendUserOp = uop.isSuccess && !uop.isPending && !paymasterSign.isPending
  const anyError = uop.error || paymasterSign.error

  const statusMessage = (() => {
    if (paymasterSign.isPending && userOpStateKey) return t(`status.${userOpStateKey}`)
    if (paymasterSign.isPending) return t('status.waiting')
    if (anyError) return t('status.retry')
    return t('status.ready')
  })()

  return (
    <YStack gap="$4" w="100%" maw={500}>
      <Paragraph color="$color10" ta="center">
        {statusMessage}
      </Paragraph>

      <Button
        size="$4"
        theme="green"
        br="$4"
        w="100%"
        h={56}
        pressStyle={{ opacity: 0.8 }}
        onPress={(e) => {
          e.preventDefault()
          if (!canSendUserOp) return
          paymasterSign.mutate({
            userop: uop.data,
            sendAccountCalls: calls,
            entryPoint: entryPointAddress[chainId],
          })
        }}
        disabled={!canSendUserOp}
        icon={<IconUpgrade size="$1" />}
        iconAfter={paymasterSign.isPending ? <Spinner size="small" /> : undefined}
      >
        <Button.Text>
          {paymasterSign.isPending ? t('actions.upgrading') : t('actions.upgrade')}
        </Button.Text>
      </Button>
      {[uop.error, paymasterSign.error].filter(Boolean).map((e) =>
        e ? (
          <Paragraph key={e.message} color="$error">
            {toNiceError(e)}
          </Paragraph>
        ) : null
      )}
    </YStack>
  )
}
