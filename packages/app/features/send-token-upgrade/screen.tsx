import {
  YStack,
  XStack,
  Stack,
  H1,
  H4,
  Card,
  Paragraph,
  Button,
  Theme,
  Link,
  Spinner,
  useToastController,
  Fade,
} from '@my/ui'
import {
  baseMainnetBundlerClient,
  baseMainnetClient,
  sendTokenV0Address,
  sendTokenV0LockboxAbi,
  sendTokenV0LockboxAddress,
  useReadSendTokenV0BalanceOf,
} from '@my/wagmi'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { IconUpgrade } from 'app/components/icons'
import { assert } from 'app/utils/assert'
import formatAmount from 'app/utils/formatAmount'
import { useSendAccount } from 'app/utils/send-accounts'
import { toNiceError } from 'app/utils/toNiceError'
import { useUserOp } from 'app/utils/userop'
import { sendUserOp } from 'app/utils/sendUserOp'
import { useEffect, useMemo, useState } from 'react'
import { encodeFunctionData, erc20Abi, isHex } from 'viem'
import { useSendAccountBalances } from 'app/utils/useSendAccountBalances'

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
 * @param children - The children to render when the upgrade is not required.
 * @returns The children if the upgrade is required, otherwise it render the upgrade button.
 */
export function SendV0TokenUpgradeScreen({ children }: { children?: React.ReactNode }) {
  const chainId = baseMainnetClient.chain.id
  const { data: sendAccount } = useSendAccount()
  const {
    data: balance,
    isPending,
    isError,
  } = useReadSendTokenV0BalanceOf({
    chainId,
    args: [sendAccount?.address ?? '0x'],
    query: { enabled: !!sendAccount?.address },
  })
  const isUpgradeRequired = !isPending && !isError && balance > BigInt(0)

  if (!isUpgradeRequired) {
    return children
  }

  return (
    <Fade f={1} ai="center" jc="center" px="$4" gap="$6">
      <YStack f={1} ai="center" jc="center" px="$4" gap="$6">
        <Theme name="green">
          <Stack mb="$2">
            <IconUpgrade size="$4" color="$primary" />
          </Stack>
        </Theme>

        <YStack ai="center" gap="$2">
          <H1 fontWeight="800" tt="uppercase">
            TOKEN UPGRADE
          </H1>
          <Paragraph color="$color10" ta="center" fontSize="$6" maw={400}>
            Upgrade required to continue using Send. New total supply: 100B → 1B
          </Paragraph>
        </YStack>

        <Card w="100%" maw={500} p="$5" gap="$4">
          <TokenBalanceRow label="CURRENT" amount={formatAmount(balance.toString(), 9, 0)} />
          <TokenBalanceRow label="AFTER" amount={formatAmount((balance / 100n).toString(), 9, 0)} />
        </Card>

        <YStack gap="$4" w="100%" maw={500} ai="center">
          <UpgradeTokenButton />

          <Theme name="green">
            <Link
              href="https://info.send.it/send-docs/send-token/send-v1-tokenomics"
              target="_blank"
              color="$color10"
            >
              <Paragraph fontSize="$4" textDecorationLine="underline" color="$primary">
                Read more about the Upgrade
              </Paragraph>
            </Link>
          </Theme>
        </YStack>
      </YStack>
    </Fade>
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
  const uop = useUserOp({
    sender,
    calls,
  })

  const sendUop = useMutation({
    mutationFn: sendUserOp,
  })

  const uopReceipt = useQuery({
    queryKey: ['userOpReceipt', sendUop.data],
    queryFn: async ({ queryKey: [, hash] }) => {
      assert(isHex(hash), 'Invalid receipt hash')
      const receipt = await baseMainnetBundlerClient.waitForUserOperationReceipt({
        hash,
      })
      assert(receipt.success === true, 'Failed to send userOp')
      return receipt
    },
    enabled: !!sendUop.submittedAt && Boolean(sendUop.data),
  })

  const toast = useToastController()
  const queryClient = useQueryClient()
  const [isUpgraded, setIsUpgraded] = useState(false)

  useEffect(() => {
    if (uopReceipt.isSuccess) {
      setIsUpgraded(true)
      toast.show('Upgraded successfully')
      queryClient.invalidateQueries({ queryKey: tokensQuery.queryKey })
      queryClient.invalidateQueries({ queryKey: sendTokenV0Bal.queryKey })
    }
  }, [toast, sendTokenV0Bal.queryKey, tokensQuery.queryKey, queryClient, uopReceipt.isSuccess])

  const canSendUserOp =
    uop.isSuccess && (sendUop.isIdle || sendUop.isError) && !uopReceipt.isLoading && !isUpgraded
  const anyError = uop.error || sendUop.error || uopReceipt.error

  return (
    <YStack gap="$4" w="100%" maw={500}>
      <Paragraph color="$color10" ta="center">
        {(() => {
          switch (true) {
            case isUpgraded:
              return 'Upgrade complete.'
            case uopReceipt.isLoading:
              return 'Waiting for confirmation...'
            default:
              return `Click "Upgrade" to proceed.${anyError ? ' Please try again.' : ''}`
          }
        })()}
      </Paragraph>

      {!isUpgraded ? (
        <Button
          size="$4"
          theme="green"
          br="$4"
          w="100%"
          h={56}
          pressStyle={{ opacity: 0.8 }}
          onPress={(e) => {
            e.preventDefault()
            if (sendUop.isError) sendUop.reset() // reset if there is an error
            if (!canSendUserOp) return
            sendUop.mutate({
              userOp: uop.data,
              webauthnCreds,
            })
          }}
          disabled={!canSendUserOp}
          icon={<IconUpgrade size="$1" />}
          iconAfter={
            sendUop.isPending || uopReceipt.isLoading ? <Spinner size="small" /> : undefined
          }
        >
          <Button.Text>
            {sendUop.isPending || uopReceipt.isLoading ? 'UPGRADING...' : 'UPGRADE'}
          </Button.Text>
        </Button>
      ) : null}
      {[uop.error, sendUop.error].filter(Boolean).map((e) =>
        e ? (
          <Paragraph key={`${e.name}-${e.message}`} color="$error">
            {toNiceError(e)}
          </Paragraph>
        ) : null
      )}
    </YStack>
  )
}
