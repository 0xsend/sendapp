import {
  Avatar,
  Button,
  ButtonText,
  Label,
  LinkableAvatar,
  Paragraph,
  type ParagraphProps,
  ScrollView,
  Separator,
  Spinner,
  XStack,
  YStack,
  type YStackProps,
} from '@my/ui'
import { baseMainnet, baseMainnetClient, entryPointAddress } from '@my/wagmi'
import { useQueryClient } from '@tanstack/react-query'
import { IconAccount } from 'app/components/icons'
import { IconCoin } from 'app/components/icons/IconCoin'
import { useSendScreenParams } from 'app/routers/params'
import { assert } from 'app/utils/assert'
import formatAmount, { localizeAmount } from 'app/utils/formatAmount'
import { useSendAccount } from 'app/utils/send-accounts'
import { shorten } from 'app/utils/strings'
import { throwIf } from 'app/utils/throwIf'
import { useProfileLookup } from 'app/utils/useProfileLookup'
import { useUSDCFees } from 'app/utils/useUSDCFees'
import { useGenerateTransferUserOp } from 'app/utils/useUserOpTransferMutation'
import { useAccountNonce } from 'app/utils/userop'
import { useEffect, useState } from 'react'
import { useRouter } from 'solito/router'
import { formatUnits, isAddress, zeroAddress } from 'viem'
import { useEstimateFeesPerGas } from 'wagmi'
import { useCoin } from 'app/provider/coins'
import { useCoinFromSendTokenParam } from 'app/utils/useCoinFromTokenParam'
import { allCoinsDict } from 'app/data/coins'

import debug from 'debug'
import { useTokenPrices } from 'app/utils/useTokenPrices'

const log = debug('app:features:send:confirm:screen')
import { api } from 'app/utils/api'
import { signUserOp } from 'app/utils/signUserOp'
import { usePendingTransfers } from 'app/features/home/utils/usePendingTransfers'
import { getUserOperationHash } from 'permissionless/utils'

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
  const { data: sendAccount, isLoading: isSendAccountLoading } = useSendAccount()
  const { coin: selectedCoin, tokensQuery, ethQuery } = useCoinFromSendTokenParam()

  const { mutateAsync: transfer } = api.transfer.withUserOp.useMutation()
  const { data: pendingTransfers, isLoading: isPendingTransfersLoading } = usePendingTransfers({
    address: sendAccount?.address ?? zeroAddress,
    token: sendToken,
  })

  const [workflowId, setWorkflowId] = useState<string | undefined>()

  useEffect(() => {
    if (workflowId) {
      router.replace({ pathname: '/', query: { token: sendToken } })
    }
  }, [workflowId, router, sendToken])

  const queryClient = useQueryClient()
  const isUSDCSelected = selectedCoin?.label === 'USDC'
  const { coin: usdc } = useCoin('USDC')
  const { data: prices, isLoading: isPricesLoading } = useTokenPrices()

  const { data: profile, isLoading: isProfileLoading } = useProfileLookup(
    idType ?? 'tag',
    recipient ?? ''
  )

  const href = profile ? `/profile/${profile?.sendid}` : ''

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
    nonce:
      nonce && pendingTransfers !== undefined ? nonce + BigInt(pendingTransfers.length) : nonce,
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

  const hasEnoughBalance = selectedCoin?.balance && selectedCoin.balance >= BigInt(amount ?? '0')
  const gas = usdcFees ? usdcFees.baseFee + usdcFees.gasFees : BigInt(Number.MAX_SAFE_INTEGER)
  const hasEnoughGas =
    (usdc?.balance ?? BigInt(0)) > (isUSDCSelected ? BigInt(amount ?? '0') + gas : gas)

  const canSubmit = BigInt(queryParams.amount ?? '0') > 0 && hasEnoughGas && hasEnoughBalance

  const localizedAmount = localizeAmount(
    formatUnits(
      BigInt(amount ?? ''),
      selectedCoin?.decimals ?? allCoinsDict[sendToken]?.decimals ?? 0
    )
  )

  const price = prices?.[sendToken] ?? 0
  const amountInUSD =
    price *
    Number(
      formatUnits(
        BigInt(amount ?? ''),
        selectedCoin?.decimals ?? allCoinsDict[sendToken]?.decimals ?? 0
      )
    )

  const onEditAmount = () => {
    router.push({
      pathname: '/send',
      query: {
        idType,
        recipient,
        amount: amount ?? '',
        sendToken,
      },
    })
  }

  async function onSubmit() {
    try {
      assert(!!userOp, 'User op is required')
      assert(!!selectedCoin?.balance, 'Balance is not available')
      assert(nonceError === null, `Failed to get nonce: ${nonceError}`)
      assert(nonce !== undefined, 'Nonce is not available')
      throwIf(feesPerGasError)
      assert(!!feesPerGas, 'Fees per gas is not available')

      assert(selectedCoin?.balance >= BigInt(amount ?? '0'), 'Insufficient balance')
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

      const signature = await signUserOp({
        userOp,
        chainId,
        webauthnCreds,
        entryPoint,
      })
      userOp.signature = signature

      const userOpHash = getUserOperationHash({
        userOperation: userOp,
        entryPoint,
        chainId,
      })

      const workflowId = await transfer({ userOpHash })
      setWorkflowId(workflowId)
      if (selectedCoin?.token === 'eth') {
        await ethQuery.refetch()
      } else {
        await tokensQuery.refetch()
      }
    } catch (e) {
      console.error(e)
      setError(e)
      await queryClient.invalidateQueries({ queryKey: [useAccountNonce.queryKey] })
    }
  }

  if (nonceIsLoading || isProfileLoading || isSendAccountLoading || isPendingTransfersLoading)
    return <Spinner size="large" color={'$color'} />

  return (
    <YStack
      f={1}
      jc={'space-between'}
      pb={'$4'}
      $gtLg={{
        display: 'flex',
        maxWidth: '50%',
      }}
    >
      <YStack gap={'$4'} pt={'$4'}>
        <YStack
          bg={'$color1'}
          br={'$6'}
          p={'$6'}
          gap={'$4.5'}
          $gtSm={{
            gap: '$5',
          }}
        >
          <XStack gap={'$4'} ai={'center'}>
            <LinkableAvatar circular size={'$3'} href={href}>
              <Avatar.Image
                src={profile?.avatar_url ?? ''}
                testID="avatarImage"
                accessibilityLabel={profile?.name ?? '??'}
                accessibilityRole="image"
                accessible
              />
              <Avatar.Fallback jc="center">
                <IconAccount size={'$3'} color="$olive" />
              </Avatar.Fallback>
            </LinkableAvatar>
            <Paragraph
              nativeID="profileName"
              size={'$6'}
              color={'$silverChalice'}
              fontWeight={'500'}
              $theme-light={{
                color: '$darkGrayTextField',
              }}
            >
              {(() => {
                switch (true) {
                  case idType === 'address':
                    return shorten(recipient, 5, 4)
                  case !!profile?.name:
                    return profile?.name
                  case !!profile?.all_tags?.[0]:
                    return `/${profile.all_tags[0]}`
                  case !!profile?.sendid:
                    return `#${profile?.sendid}`
                  default:
                    return '??'
                }
              })()}
            </Paragraph>
          </XStack>
          <XStack w="100%" jc="space-between" ai="flex-end" flexWrap={'wrap'}>
            <YStack gap={'$2'}>
              <XStack ai={'center'} gap={'$2'}>
                <Paragraph
                  fontWeight={'700'}
                  size={localizedAmount.length > 18 ? '$7' : '$9'}
                  $gtSm={{
                    size: localizedAmount.length > 16 ? '$8' : '$10',
                  }}
                >
                  {localizedAmount} {selectedCoin?.symbol}
                </Paragraph>
                <IconCoin
                  symbol={selectedCoin?.symbol ?? 'USDC'}
                  size={localizedAmount.length > 10 ? '$1.5' : '$2.5'}
                />
              </XStack>
              {isPricesLoading ? (
                <Spinner size="small" color={'$color12'} />
              ) : (
                <Paragraph color={'$color10'} fontSize={'$3'} fontFamily={'$mono'} mt={-1}>
                  (
                  {amountInUSD.toLocaleString('en-US', {
                    style: 'currency',
                    currency: 'USD',
                    maximumFractionDigits: 2,
                  })}
                  )
                </Paragraph>
              )}
            </YStack>
            <Paragraph
              onPress={onEditAmount}
              cursor="pointer"
              hoverStyle={{ color: '$primary' }}
              size={'$5'}
              pl={'$2'}
              textAlign={'right'}
            >
              edit
            </Paragraph>
          </XStack>
          <Separator px="$4" bw="$0.75" borderRadius={'$4'} />
          <YStack gap={'$2'}>
            <XStack ai={'center'} jc={'space-between'} gap={'$4'}>
              <Paragraph
                color={'$silverChalice'}
                size={'$6'}
                $theme-light={{
                  color: '$darkGrayTextField',
                }}
              >
                Fees
              </Paragraph>
              {isFeesLoading && <Spinner size="small" color={'$color11'} />}
              {usdcFees && (
                <Paragraph size={'$6'}>
                  {formatAmount(
                    formatUnits(usdcFees.baseFee + usdcFees.gasFees, usdcFees.decimals)
                  )}{' '}
                  USDC
                </Paragraph>
              )}
              {usdcFeesError && (
                <Paragraph color="$error">{usdcFeesError?.message?.split('.').at(0)}</Paragraph>
              )}
            </XStack>
          </YStack>
        </YStack>
        {error && (
          <ErrorMessage
            error={(error as { details?: string }).details ?? error.message ?? 'Error sending'}
          />
        )}
      </YStack>
      <Button
        theme={canSubmit ? 'green' : 'red_alt1'}
        onPress={onSubmit}
        br={'$4'}
        disabledStyle={{ opacity: 0.7, cursor: 'not-allowed', pointerEvents: 'none' }}
        disabled={!canSubmit || !!workflowId}
        gap={4}
        py={'$5'}
        width={'100%'}
      >
        {(() => {
          switch (true) {
            case isFeesLoading || isGasLoading:
              return (
                <Button.Icon>
                  <Spinner size="small" color="$color12" />
                </Button.Icon>
              )
            case !hasEnoughBalance:
              return <Button.Text fontWeight={'600'}>Insufficient Balance</Button.Text>
            case !hasEnoughGas:
              return <Button.Text fontWeight={'600'}>Insufficient Gas</Button.Text>
            default:
              return <Button.Text fontWeight={'600'}>SEND</Button.Text>
          }
        })()}
      </Button>
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

function ErrorMessage({ error, ...props }: ParagraphProps & { error?: string }) {
  if (!error) return null

  return (
    <ScrollView height="$4">
      <Paragraph testID="SendConfirmError" size="$2" width="100%" col={'$error'} {...props}>
        {error.split('.').at(0)}
      </Paragraph>
    </ScrollView>
  )
}
