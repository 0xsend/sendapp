import {
  useToastController,
  Paragraph,
  Container,
  Spinner,
  XStack,
  YStack,
  Stack,
  Button,
  Label,
  Avatar,
} from '@my/ui'

import { useSendAccounts } from 'app/utils/send-accounts'
import { useAccountNonce } from 'app/utils/userop'
import { assert } from 'app/utils/assert'

import { baseMainnet } from '@my/wagmi'
import { useBalance } from 'wagmi'
// @ts-expect-error some work to do here
import { useSendParams } from 'app/routers/params'
import { useForm } from 'react-hook-form'
import { formFields } from 'app/utils/SchemaForm'
import { useState } from 'react'
import { z } from 'zod'
import { useProfileLookup } from 'app/utils/useProfileLookup'
import { type Hex, parseUnits, isAddress } from 'viem'
import {
  useGenerateTransferUserOp,
  useUserOpGasEstimate,
  useUserOpTransferMutation,
} from 'app/utils/useUserOpTransferMutation'
import { useLink } from 'solito/link'
import { useRouter } from 'solito/router'
import { coins } from 'app/data/coins'
import { IconAccount } from 'app/components/icons'
import { IconCoin } from 'app/components/icons/IconCoin'

type ProfileProp = NonNullable<ReturnType<typeof useProfileLookup>['data']>

const SendConfirmSchema = z.object({
  amount: formFields.number,
  token: formFields.select,
  recipient: formFields.text,
})

export function SendConfirmScreen() {
  const {
    params: { recipient, sendToken: tokenParam, amount: amountParam },
  } = useSendParams()
  const { data: profile, isLoading, error } = useProfileLookup('tag', recipient)
  const router = useRouter()

  if (isLoading) return <Spinner size="large" />
  if (error) throw new Error(error.message)
  if (!profile) {
    router.replace({
      pathname: '/send',
      query: { recipient, sendToken: tokenParam, amount: amountParam },
    })
    return null
  }

  return <SendConfirm profile={profile} />
}

export function SendConfirm({ profile }: { profile: ProfileProp }) {
  const toast = useToastController()
  const form = useForm<z.infer<typeof SendConfirmSchema>>()
  const { data: sendAccounts } = useSendAccounts()
  const sendAccount = sendAccounts?.[0]
  const [sentUserOpTxHash, setSentUserOpTxHash] = useState<Hex>()
  const {
    params: { sendToken: tokenParam, amount: amountParam, recipient },
  } = useSendParams()

  const router = useRouter()
  const {
    data: balance,
    isPending: balanceIsPending,
    error: balanceError,
    refetch: balanceRefetch,
  } = useBalance({
    address: sendAccount?.address,
    token: tokenParam === 'eth' ? undefined : tokenParam,
    query: { enabled: !!sendAccount },
    chainId: baseMainnet.id,
  })

  const amount = parseUnits((amountParam ?? '0').toString(), balance?.decimals ?? 0)
  const { data: nonce, error: nonceError } = useAccountNonce({ sender: sendAccount?.address })
  const { data: userOp } = useGenerateTransferUserOp({
    sender: sendAccount?.address,
    // @ts-expect-error some work to do here
    to: profile?.address,
    token: tokenParam === 'eth' ? undefined : tokenParam,
    amount: BigInt(amount),
    nonce: nonce ?? 0n,
  })

  const { data: gasEstimate } = useUserOpGasEstimate({ userOp })
  const { mutateAsync: sendUserOp } = useUserOpTransferMutation()

  const sentTxLink = useLink({
    href: `${baseMainnet.blockExplorers.default.url}/tx/${sentUserOpTxHash}`,
  })

  console.log('gasEstimate', gasEstimate)
  console.log('userOp', userOp)

  // need balance to check if user has enough to send

  const canSubmit =
    Number(amountParam) > 0 &&
    coins.some((coin) => coin.token === tokenParam) &&
    (balance?.value ?? BigInt(0) >= amount)

  async function onSubmit() {
    try {
      assert(!!userOp, 'User op is required')
      assert(!!balance, 'Balance is not available')
      assert(nonceError === null, `Failed to get nonce: ${nonceError}`)
      assert(nonce !== undefined, 'Nonce is not available')

      assert(balance.value >= amount, 'Insufficient balance')
      const sender = sendAccount?.address as `0x${string}`
      assert(isAddress(sender), 'No sender address')

      const receipt = await sendUserOp({
        userOp,
      })
      assert(receipt.success, 'Failed to send user op')
      setSentUserOpTxHash(receipt.receipt.transactionHash)
      toast.show(`Sent user op ${receipt.receipt.transactionHash}!`)
      balanceRefetch()
    } catch (e) {
      console.error(e)
      toast.show('Failed to send user op')
      form.setError('amount', { type: 'custom', message: `${e}` })
    }
  }

  return (
    <Container $gtLg={{ jc: 'flex-start' }} jc="center" f={1} pb="$5">
      <YStack gap="$5" width="100%" f={1}>
        <Stack $gtLg={{ fd: 'row', gap: '$12', miw: 80 }} w="100%" gap="$5">
          <YStack gap="$2.5" f={1} $gtLg={{ maw: 350 }}>
            <XStack jc="space-between" ai="center" gap="$3">
              <Label fontWeight="500" fontSize={'$5'}>
                To
              </Label>
              <Paragraph
                onPress={() =>
                  router.push({
                    pathname: '/send',
                    query: { recipient, sendToken: tokenParam, amount: amountParam },
                  })
                }
              >
                edit
              </Paragraph>
            </XStack>
            <XStack
              ai="center"
              gap="$3"
              bc="$metalTouch"
              p="$3"
              br="$3"
              $theme-light={{ bc: '$gray3Light' }}
              f={1}
            >
              <Avatar size="$4.5" br="$3">
                <Avatar.Image src={profile?.avatar_url ?? ''} />
                <Avatar.Fallback jc="center">
                  <IconAccount size="$4.5" color="$olive" />
                </Avatar.Fallback>
              </Avatar>
              <YStack gap="$1.5">
                <Paragraph fontSize="$4" fontWeight="500" color="$color12">
                  {profile?.name}
                </Paragraph>
                <Paragraph
                  fontFamily="$mono"
                  fontSize="$4"
                  fontWeight="400"
                  lineHeight="$1"
                  color="$color12"
                >
                  @{profile?.tag}
                </Paragraph>
              </YStack>
            </XStack>
          </YStack>

          <YStack gap="$2.5" f={1} $gtLg={{ maw: 350 }}>
            <XStack jc="space-between" ai="center" gap="$3">
              <Label fontWeight="500" fontSize={'$5'}>
                Amount
              </Label>
              <Paragraph
                onPress={() =>
                  router.push({
                    pathname: '/send',
                    query: { recipient, sendToken: tokenParam, amount: amountParam },
                  })
                }
              >
                edit
              </Paragraph>
            </XStack>
            <XStack
              ai="center"
              gap="$3"
              bc="$metalTouch"
              p="$3"
              br="$3"
              $theme-light={{ bc: '$gray3Light' }}
              f={1}
            >
              <Paragraph fontSize="$5" fontWeight="500" color="$color12">
                {amountParam}
              </Paragraph>
              {(() => {
                const coin = coins.find((coin) => coin.token === tokenParam)
                if (coin) {
                  return <IconCoin coin={coin} />
                }
                return null
              })()}
            </XStack>
          </YStack>
        </Stack>
        {/*  TODO add this back when backend is ready
        <YStack gap="$5" f={1}>
          <Label fontWeight="500" fontSize={'$5'} textTransform="uppercase">
            ADD A NOTE
          </Label>
          <Input
            placeholder="(Optional)"
            value={note}
            onChangeText={(text) => setParams({ note: text }, { webBehavior: 'replace' })}
            fontSize={20}
            fontWeight="400"
            lineHeight={1}
            color="$color12"
            borderColor="transparent"
            outlineColor="transparent"
            $theme-light={{ bc: '$gray3Light' }}
            br={'$3'}
            bc="$metalTouch"
            hoverStyle={{
              borderColor: 'transparent',
              outlineColor: 'transparent',
            }}
            focusStyle={{
              borderColor: 'transparent',
              outlineColor: 'transparent',
            }}
            fontFamily="$mono"
          />
        </YStack> */}
        <Stack w="100%" jc="flex-end" ai="center" $gtLg={{ ai: 'flex-end' }} mt="auto">
          <Button
            theme="green"
            onPress={onSubmit}
            px="$15"
            br={12}
            disabledStyle={{ opacity: 0.5 }}
            disabled={!canSubmit}
          >
            <Button.Text>/SEND</Button.Text>
          </Button>
        </Stack>
      </YStack>
    </Container>
  )
}
