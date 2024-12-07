import {
  Avatar,
  Button,
  ButtonText,
  Label,
  LinkableAvatar,
  Paragraph,
  ScrollView,
  Spinner,
  Stack,
  XStack,
  YStack,
  type ParagraphProps,
  type YStackProps,
} from '@my/ui'
import { baseMainnet, baseMainnetClient, entryPointAddress } from '@my/wagmi'
import { useQueryClient } from '@tanstack/react-query'
import { IconAccount } from 'app/components/icons'
import { IconCoin } from 'app/components/icons/IconCoin'
import { coinsDict } from 'app/data/coins'
import { useTokenActivityFeed } from 'app/features/home/utils/useTokenActivityFeed'
import { useSendScreenParams } from 'app/routers/params'
import { assert } from 'app/utils/assert'
import formatAmount from 'app/utils/formatAmount'
import { useSendAccount } from 'app/utils/send-accounts'
import { shorten } from 'app/utils/strings'
import { throwIf } from 'app/utils/throwIf'
import { useProfileHref } from 'app/utils/useProfileHref'
import { useProfileLookup } from 'app/utils/useProfileLookup'
import { useSendAccountBalances } from 'app/utils/useSendAccountBalances'
import { useUSDCFees } from 'app/utils/useUSDCFees'
import { useGenerateTransferUserOp } from 'app/utils/useUserOpTransferMutation'
import { useAccountNonce } from 'app/utils/userop'
import { useEffect, useState } from 'react'
import { useRouter } from 'solito/router'
import { formatUnits, isAddress, parseUnits, type Hex } from 'viem'
import { useEstimateFeesPerGas } from 'wagmi'
import { api } from 'app/utils/api'
import { getUserOperationHash } from 'permissionless'
import { signUserOp } from 'app/utils/signUserOp'
import { byteaToBase64 } from 'app/utils/byteaToBase64'
import { localizeAmount } from 'app/utils/formatAmount'

export function SendConfirmScreen() {
  const [queryParams] = useSendScreenParams()
  const { recipient, idType, sendToken, amount } = queryParams
  const { data: profile, isLoading, error } = useProfileLookup(idType ?? 'tag', recipient ?? '')

  const router = useRouter()

  useEffect(() => {
    if (!recipient)
      router.replace({
        pathname: '/send',
        query: {
          idType: idType,
          recipient: recipient,
          sendToken: sendToken,
          amount: amount,
        },
      })
  }, [recipient, idType, router, sendToken, amount])

  if (error) throw new Error(error.message)
  if (isLoading && !profile) return <Spinner size="large" />
  return <SendConfirm />
}

export function SendConfirm() {
  const router = useRouter()
  const [queryParams] = useSendScreenParams()
  const { sendToken, recipient, idType, amount } = queryParams

  const { mutateAsync: transfer } = api.transfer.withUserOp.useMutation()

  const [workflowId, setWorkflowId] = useState<string | undefined>()

  useEffect(() => {
    if (workflowId) {
      router.replace({ pathname: '/', query: { token: sendToken } })
    }
  }, [workflowId, router, sendToken])

  const queryClient = useQueryClient()
  const { data: sendAccount } = useSendAccount()
  const { balances, isLoading: isBalanceLoading } = useSendAccountBalances()
  const usdcBalance = balances?.USDC
  const [tokenSymbol, tokenDecimals] = [coinsDict[sendToken].symbol, coinsDict[sendToken].decimals]
  const tokenBalance = balances?.[tokenSymbol]

  const { data: profile, isLoading: isProfileLoading } = useProfileLookup(
    idType ?? 'tag',
    recipient ?? ''
  )

  const webauthnCreds =
    sendAccount?.send_account_credentials
      .filter((c) => !!c.webauthn_credentials)
      .map((c) => c.webauthn_credentials as NonNullable<typeof c.webauthn_credentials>) ?? []

  const {
    data: nonce,
    error: nonceError,
    isLoading: nonceIsLoading,
  } = useAccountNonce({
    sender: sendAccount?.address,
  })
  const { data: userOp } = useGenerateTransferUserOp({
    sender: sendAccount?.address,
    // @ts-expect-error some work to` do here
    to: profile?.address ?? recipient,
    token: sendToken === 'eth' ? undefined : sendToken,
    amount: BigInt(queryParams.amount ?? '0'),
    nonce: nonce ?? 0n,
  })

  const {
    data: usdcFees,
    isLoading: isFeesLoading,
    error: usdcFeesError,
  } = useUSDCFees({
    userOp,
  })

  const {
    data: feesPerGas,
    isLoading: isGasLoading,
    error: feesPerGasError,
  } = useEstimateFeesPerGas({
    chainId: baseMainnet.id,
  })

  const [error, setError] = useState<Error>()

  const hasEnoughGas = usdcFees && (usdcBalance ?? BigInt(0)) >= usdcFees.baseFee + usdcFees.gasFees

  const hasEnoughBalance = tokenBalance && tokenBalance >= BigInt(amount ?? '0')

  const canSubmit =
    BigInt(queryParams.amount ?? '0') > 0 &&
    coinsDict[queryParams.sendToken] &&
    hasEnoughGas &&
    hasEnoughBalance

  async function onSubmit() {
    try {
      assert(!!userOp, 'User op is required')
      assert(!!tokenBalance, 'Balance is not available')
      assert(nonceError === null, `Failed to get nonce: ${nonceError}`)
      assert(nonce !== undefined, 'Nonce is not available')
      throwIf(feesPerGasError)
      assert(!!feesPerGas, 'Fees per gas is not available')
      assert(!!profile?.address, 'Could not resolve recipients send account')

      assert(tokenBalance >= BigInt(amount ?? '0'), 'Insufficient balance')
      const sender = sendAccount?.address as `0x${string}`
      assert(isAddress(sender), 'No sender address')
      const _userOp = {
        ...userOp,
        maxFeePerGas: feesPerGas.maxFeePerGas,
        maxPriorityFeePerGas: feesPerGas.maxPriorityFeePerGas,
      }

      console.log('gasEstimate', usdcFees)
      console.log('feesPerGas', feesPerGas)
      console.log('userOp', _userOp)
      const chainId = baseMainnetClient.chain.id
      const entryPoint = entryPointAddress[chainId]
      const userOpHash = getUserOperationHash({
        userOperation: userOp,
        entryPoint,
        chainId,
      })
      const signature = await signUserOp({
        userOpHash,
        allowedCredentials:
          webauthnCreds?.map((c) => ({
            id: byteaToBase64(c.raw_credential_id),
            userHandle: c.name,
          })) ?? [],
      })
      userOp.signature = signature

      const workflowId = await transfer({ userOp, token: sendToken })
      setWorkflowId(workflowId)
    } catch (e) {
      console.error(e)
      setError(e)
      await queryClient.invalidateQueries({ queryKey: [useAccountNonce.queryKey] })
    }
  }

  if (nonceIsLoading || isProfileLoading) return <Spinner size="large" color={'$color'} />

  return (
    <YStack
      $gtLg={{ jc: 'flex-start', ai: 'flex-start' }}
      flexDirection="column"
      jc="center"
      ai="center"
      f={1}
      pb="$5"
    >
      <YStack
        gap="$6"
        width="100%"
        f={1}
        maw={784}
        $sm={{
          jc: 'space-between',
        }}
      >
        <Stack w="100%" gap="$5" ai="flex-end">
          <Stack $gtLg={{ fd: 'row', gap: '$12', miw: 80 }} w="100%" gap="$5">
            <SendRecipient $gtLg={{ f: 1, maw: 350 }} />
            <SendAmount />
          </Stack>
          <XStack gap="$5" jc="flex-end">
            {isFeesLoading && <Spinner size="small" color={'$color11'} />}
            {usdcFees && (
              <Paragraph fontFamily={'$mono'} fontWeight={'400'} fontSize={'$5'} col={'$color12'}>
                + Transaction Fee:{' '}
                {formatAmount(formatUnits(usdcFees.baseFee + usdcFees.gasFees, usdcFees.decimals))}{' '}
                USDC
              </Paragraph>
            )}
            {usdcFeesError && (
              <Paragraph color="$error">{usdcFeesError?.message?.split('.').at(0)}</Paragraph>
            )}
          </XStack>
        </Stack>

        {/*  TODO add this back when backend is ready
        <YStack gap="$5" f={1}>
          <Label
            fontWeight="500"
            fontSize={'$5'}
            textTransform="uppercase"
            $theme-dark={{ col: '$gray8Light' }}
          >
            ADD A NOTE
          </Label>
          <Input
            placeholder="(Optional)"
            placeholderTextColor="$color12"
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
        <Button
          theme={canSubmit ? 'green' : 'red_alt1'}
          onPress={onSubmit}
          br={12}
          disabledStyle={{ opacity: 0.7, cursor: 'not-allowed', pointerEvents: 'none' }}
          disabled={!canSubmit || !!workflowId}
          gap={4}
          mx="auto"
          $gtXs={{
            maw: 350,
          }}
          $gtLg={{
            mr: '0',
            ml: 'auto',
          }}
          width={'100%'}
        >
          {(() => {
            switch (true) {
              case isBalanceLoading || isFeesLoading || isGasLoading:
                return (
                  <Button.Icon>
                    <Spinner size="small" color="$color12" />
                  </Button.Icon>
                )
              case isTransferPending && !isTransferError:
                return (
                  <>
                    <Button.Icon>
                      <Spinner size="small" color="$color12" />
                    </Button.Icon>
                    <Button.Text>Sending...</Button.Text>
                  </>
                )
              case sentTxHash !== undefined:
                return (
                  <>
                    <Button.Icon>
                      <Spinner size="small" color="$color12" />
                    </Button.Icon>
                    <Button.Text>Confirming...</Button.Text>
                  </>
                )
              case !hasEnoughBalance:
                return <Button.Text>Insufficient Balance</Button.Text>
              case !hasEnoughGas:
                return <Button.Text>Insufficient Gas</Button.Text>
              default:
                return <Button.Text fontWeight={'500'}>/SEND</Button.Text>
            }
          })()}
        </Button>
        {error && (
          <ErrorMessage
            mx="auto"
            $gtXs={{
              maw: 350,
            }}
            $gtLg={{
              mr: '0',
              ml: 'auto',
            }}
            error={(error as { details?: string }).details ?? error.message ?? 'Error sending'}
          />
        )}
      </YStack>
    </YStack>
  )
}

export function SendRecipient({ ...props }: YStackProps) {
  const [queryParams] = useSendScreenParams()
  const { recipient, idType } = queryParams
  const router = useRouter()
  const { data: profile, isLoading, error } = useProfileLookup(idType ?? 'tag', recipient ?? '')
  const href = profile ? `/profile/${profile?.sendid}` : ''

  if (isLoading) return <Spinner size="large" />
  if (error) throw new Error(error.message)

  return (
    <YStack gap="$2.5" {...props}>
      <XStack jc="space-between" ai="center" gap="$3">
        <Label
          fontWeight="500"
          fontSize={'$5'}
          textTransform="uppercase"
          $theme-dark={{ col: '$gray8Light' }}
        >
          TO
        </Label>
        <Button
          bc="transparent"
          chromeless
          hoverStyle={{ bc: 'transparent' }}
          pressStyle={{ bc: 'transparent' }}
          focusStyle={{ bc: 'transparent' }}
          onPress={() =>
            router.push({
              pathname: '/send',
              query: { sendToken: queryParams.sendToken, amount: queryParams.amount },
            })
          }
        >
          <ButtonText $theme-dark={{ col: '$primary' }}>edit</ButtonText>
        </Button>
      </XStack>
      <XStack
        ai="center"
        gap="$3"
        bc="$metalTouch"
        p="$2"
        br="$3"
        $theme-light={{ bc: '$gray3Light' }}
      >
        <LinkableAvatar size="$4.5" br="$3" href={href}>
          <Avatar.Image src={profile?.avatar_url ?? ''} />
          <Avatar.Fallback jc="center">
            <IconAccount size="$4.5" color="$olive" />
          </Avatar.Fallback>
        </LinkableAvatar>
        <YStack gap="$1.5">
          <Paragraph fontSize="$4" fontWeight="500" color="$color12">
            {profile?.name}
          </Paragraph>
          <Paragraph
            fontFamily="$mono"
            fontSize="$4"
            fontWeight="400"
            lineHeight="$1"
            color="$color11"
          >
            {(() => {
              switch (true) {
                case idType === 'address':
                  return shorten(recipient, 5, 4)
                case !!profile?.tag:
                  return `/${profile?.tag}`
                default:
                  return `#${profile?.sendid}`
              }
            })()}
          </Paragraph>
        </YStack>
      </XStack>
    </YStack>
  )
}

const SendAmount = () => {
  const [queryParams] = useSendScreenParams()
  const { sendToken, recipient, idType, amount } = queryParams
  const router = useRouter()
  const localizedAmount = localizeAmount(
    formatUnits(BigInt(queryParams.amount ?? ''), coinsDict[queryParams.sendToken].decimals)
  )
  return (
    <YStack gap="$2.5" f={1} $gtLg={{ maw: 350 }} jc="space-between">
      <XStack jc="space-between" ai="center" gap="$3">
        <Label
          fontWeight="500"
          fontSize="$5"
          textTransform="uppercase"
          $theme-dark={{ col: '$gray8Light' }}
        >
          AMOUNT
        </Label>
        <Button
          bc="transparent"
          chromeless
          hoverStyle={{ bc: 'transparent' }}
          pressStyle={{ bc: 'transparent' }}
          focusStyle={{ bc: 'transparent' }}
          onPress={() =>
            router.push({
              pathname: '/send',
              query: {
                recipient,
                idType,
                sendToken,
                amount,
              },
            })
          }
        >
          <ButtonText $theme-dark={{ col: '$primary' }}>edit</ButtonText>
        </Button>
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
        <Paragraph fontSize="$9" fontWeight="600" color="$color12">
          {localizedAmount}
        </Paragraph>
        <IconCoin coin={coinsDict[queryParams.sendToken]} />
      </XStack>
    </YStack>
  )
}

function ErrorMessage({ error, ...props }: ParagraphProps & { error?: string }) {
  if (!error) return null

  return (
    <ScrollView height="$4">
      <Paragraph
        testID="SendConfirmError"
        size="$2"
        maw="$20"
        width="100%"
        col={'$error'}
        {...props}
      >
        {error.split('.').at(0)}
      </Paragraph>
    </ScrollView>
  )
}
