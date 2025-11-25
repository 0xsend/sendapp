import {
  Button,
  Card,
  Fade,
  H1,
  H4,
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
  baseMainnetClient,
  sendBaseMainnetBundlerClient,
  entryPointAddress,
  tokenPaymasterAddress,
  sendVerifyingPaymasterAddress,
  usdcAddress,
} from '@my/wagmi'
import { useQueryClient } from '@tanstack/react-query'
import { IconUpgrade } from 'app/components/icons'
import { api } from 'app/utils/api'
import { assert } from 'app/utils/assert'
import formatAmount from 'app/utils/formatAmount'
import { useSendAccount } from 'app/utils/send-accounts'
import { signUserOp } from 'app/utils/signUserOp'
import { toNiceError } from 'app/utils/toNiceError'
import { useUserOp } from 'app/utils/userop'
import { usePaymasterAllowanceCheck } from 'app/utils/usePaymasterAllowanceCheck'
import { useMemo, useState } from 'react'
import { encodeFunctionData, erc20Abi, maxUint256, withRetry } from 'viem'
import { useTranslation } from 'react-i18next'

interface AllowanceRowProps {
  label: string
  amount: string
}

function AllowanceRow({ label, amount }: AllowanceRowProps) {
  return (
    <XStack w="100%" ai="center" jc="space-between">
      <XStack ai="center" gap="$2">
        <Theme name="green">
          <Stack w={16} h={16} br="$2" bc="$color8" />
        </Theme>
        <H4 color="$color11">{label}</H4>
      </XStack>
      <Paragraph fontSize="$6" fontWeight="600">
        {amount}
      </Paragraph>
    </XStack>
  )
}

export function PaymasterAllowanceScreen({ children }: { children?: React.ReactNode }) {
  const chainId = baseMainnetClient.chain.id
  const { data: sendAccount } = useSendAccount()
  const { t } = useTranslation('paymasterAllowance')

  const { needsApproval, isLoading, error, currentAllowance } = usePaymasterAllowanceCheck({
    chainId,
    sendAccount: sendAccount?.address,
  })

  // If there's an error checking allowance, log it but don't block the user
  if (error) {
    console.error('Failed to check USDC allowance for paymaster:', error)
    return children
  }

  if (isLoading || !needsApproval) {
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
            <AllowanceRow
              label={t('allowances.current')}
              amount={formatAmount((currentAllowance ?? 0n).toString(), 6, 2)}
            />
            <AllowanceRow label={t('allowances.required')} amount={t('allowances.unlimited')} />
          </Card>

          <YStack gap="$4" w="100%" maw={500} ai="center">
            <ApproveButton />
          </YStack>
        </YStack>
      </Fade>
    </ScrollView>
  )
}

function ApproveButton() {
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
  const [userOpStateKey, setUserOpStateKey] = useState<string | null>(null)
  const { t } = useTranslation('paymasterAllowance')

  const calls = useMemo(
    () => [
      {
        dest: usdcAddress[chainId],
        value: 0n,
        data: encodeFunctionData({
          abi: erc20Abi,
          functionName: 'approve',
          args: [tokenPaymasterAddress[chainId], maxUint256],
        }),
      },
    ],
    [chainId]
  )

  const paymasterSign = api.sendAccount.paymasterSign.useMutation({
    onMutate: () => setUserOpStateKey('requesting'),
    onSuccess: async (data) => {
      assert(uop.isSuccess, 'uop is not success')

      uop.data.paymasterData = data.paymasterData

      uop.data.signature = await signUserOp({
        userOp: uop.data,
        webauthnCreds,
        chainId,
        entryPoint: entryPointAddress[chainId],
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

      toast.show(t('toast.success'))
    },
    onSettled() {
      queryClient.invalidateQueries()
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
          {paymasterSign.isPending ? t('actions.approving') : t('actions.approve')}
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
