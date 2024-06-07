import {
  Button,
  ButtonText,
  Fade,
  FormWrapper,
  H2,
  Paragraph,
  Shake,
  Spinner,
  SubmitButton,
  XStack,
  YStack,
} from '@my/ui'
import { baseMainnet } from '@my/wagmi'
import { useChainModal, useConnectModal } from '@rainbow-me/rainbowkit'
import { IconEthereum } from 'app/components/icons'
import { IconChainBase } from 'app/components/icons/IconChainBase'
import { coins, type coin } from 'app/data/coins'
import { SchemaForm, formFields } from 'app/utils/SchemaForm'
import { assert } from 'app/utils/assert'
import formatAmount from 'app/utils/formatAmount'
import { useSendAccount } from 'app/utils/send-accounts'
import { shorten } from 'app/utils/strings'
import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { Link } from 'solito/link'
import { encodeFunctionData, erc20Abi, formatUnits, parseUnits, zeroAddress } from 'viem'
import {
  useAccount,
  useBalance,
  usePrepareTransactionRequest,
  useSendTransaction,
  useSwitchAccount,
} from 'wagmi'
import { z } from 'zod'

/**
 * Deposit from web3 wallet
 * 1. Connect to web3 wallet
 * 2. Select token USDC, ETH, or SEND and enter amount
 * 3. Sign transaction
 */
export function DepositWeb3Screen() {
  const { openConnectModal } = useConnectModal()
  const { isConnected, chainId, chain } = useAccount()
  const { openChainModal } = useChainModal()

  useEffect(() => {
    if (!isConnected) {
      openConnectModal?.()
    }
  }, [isConnected, openConnectModal])

  if (!isConnected) {
    return (
      <YStack gap="$4" mt="$4">
        <H2 size={'$8'} fontWeight={'300'} color={'$color05'}>
          Connect to Deposit
        </H2>
        <Paragraph size={'$6'} fontWeight={'300'} color={'$color05'}>
          You need to connect to a wallet to deposit funds.
        </Paragraph>
        <Button
          accessible
          icon={<IconEthereum size={'$1'} color={'$color12'} />}
          onPress={openConnectModal}
        >
          Connect to Deposit
        </Button>
      </YStack>
    )
  }

  if (chainId !== baseMainnet.id) {
    return (
      <YStack gap="$4" mt="$4">
        <H2 size={'$8'} fontWeight={'300'} color={'$color05'}>
          Switch to Base
        </H2>
        <Paragraph size={'$6'} fontWeight={'300'} color={'$color05'}>
          You are currently on {chain?.name}. Switch to Base to deposit funds.
        </Paragraph>
        <Button accessible icon={<IconChainBase size={'$1'} />} onPress={openChainModal}>
          Switch to Base
        </Button>
      </YStack>
    )
  }

  return <DepositForm />
}

const schema = z.object({
  token: formFields.select.describe('Token'),
  amount: formFields.text.describe('Amount'),
})

type DepositSchema = z.infer<typeof schema>

function DepositForm() {
  const form = useForm<DepositSchema>()
  const options = coins.map((coin) => ({ name: coin.symbol, value: coin.token }))
  const first = options[0]
  assert(!!first, 'first coin not found')

  const coin = coins.find((coin) => coin.token === form.watch('token'))
  const amount = form.watch('amount')
  let value = 0n
  try {
    value = parseUnits(amount ?? '0', coin?.decimals ?? 0)
  } catch (e) {
    // ignore
  }
  const { address: account } = useAccount()
  const { connectors, switchAccount } = useSwitchAccount()
  const { data: sendAccount } = useSendAccount()

  const {
    data: depositorBalance,
    isLoading: isLoadingDepositorBalance,
    error: balanceDepositorError,
  } = useBalance({
    address: account,
    token: coin?.token === 'eth' ? undefined : coin?.token,
    query: { enabled: !!account && !!coin },
    chainId: baseMainnet.id,
  })
  const isDepositorEmpty = depositorBalance?.value === 0n
  const {
    // helpful but not required for submitting
    data: sendAccountBalance,
  } = useBalance({
    address: sendAccount?.address,
    token: coin?.token === 'eth' ? undefined : coin?.token,
    query: { enabled: !!sendAccount && !!coin },
    chainId: baseMainnet.id,
  })
  const request = useDepositTransactionRequest({
    coin,
    value,
    account,
    sendAccount,
  })
  const {
    data: txData,
    isLoading: isLoadingTx,
    error: txError,
    isFetching: isFetchingTx,
    isFetched: isFetchedTx,
  } = request
  const { data: hash, sendTransactionAsync } = useSendTransaction()
  const canSubmit = !hash && !isLoadingTx && !isFetchingTx && isFetchedTx
  const isSubmitting = form.formState.isSubmitting

  // handle tx error
  useEffect(() => {
    if (txError) {
      form.setError('root', {
        type: 'custom',
        message:
          txError.name !== 'Error'
            ? txError.details?.split('.').at(0)
            : txError.message.split('.').at(0),
      })
    }
  }, [txError, form])

  // handle depositor balance error
  useEffect(() => {
    if (isLoadingDepositorBalance) return
    if (balanceDepositorError) {
      if (balanceDepositorError.name !== 'Error') {
        form.setError('root', {
          type: 'custom',
          message: balanceDepositorError.details?.split('.').at(0),
        })
      } else {
        form.setError('root', {
          type: 'custom',
          message: balanceDepositorError.message.split('.').at(0),
        })
      }
    }
    // check if balance is enough
    if (isDepositorEmpty || (depositorBalance?.value ?? 0n) < value) {
      form.setError('amount', {
        type: 'custom',
        message: 'Insufficient balance',
      })

      form.setError('root', {
        type: 'custom',
        message: 'Switch to an account with more funds',
      })
    } else {
      form.clearErrors('amount')
      form.clearErrors('root')
    }
  }, [
    depositorBalance,
    value,
    form,
    isLoadingDepositorBalance,
    isDepositorEmpty,
    balanceDepositorError,
  ])

  const onSubmit = async () => {
    if (!canSubmit) return
    try {
      assert(!!txData, 'Transaction data is required')
      assert(!!txData.to, 'Transaction to is required')
      await sendTransactionAsync({
        ...txData,
        to: txData.to, // do not know why typescript thinkgs to might be null
      })
    } catch (e) {
      console.error(e)
      if (e.name !== 'Error') {
        const message = e?.details?.split('.').at(0) ?? e?.message.split('.').at(0)
        form.setError('root', {
          type: 'custom',
          message,
        })
      }
      const message = e.message.split('.').at(0)
      form.setError('root', {
        type: 'custom',
        message,
      })
    }
  }

  return (
    <SchemaForm
      form={form}
      onSubmit={onSubmit}
      schema={schema}
      props={{
        token: {
          options: options,
        },
        amount: {
          autoFocus: true,
        },
      }}
      formProps={{
        $gtSm: {
          als: 'flex-start',
        },
      }}
      defaultValues={{
        token: first.value,
      }}
      renderBefore={() => (
        <FormWrapper.Body pb="$4" testID="DepositWeb3ScreeBefore">
          <Link
            href={`${baseMainnet.blockExplorers.default.url}/address/${account}`}
            target="_blank"
          >
            <H2 size={'$4'} fontWeight={'300'} color={'$color05'}>
              Depositing from {account}
            </H2>
          </Link>
        </FormWrapper.Body>
      )}
      renderAfter={({ submit }) => (
        <FormWrapper.Body testID="DepositWeb3ScreeAfter">
          <YStack gap="$2">
            {form.formState.errors?.root?.message ? (
              <Shake>
                <Paragraph color="red">{form.formState.errors?.root?.message}</Paragraph>
              </Shake>
            ) : null}
            {value > 0n ? (
              <Fade>
                <Paragraph size="$3">
                  Your new Send Account balance will be {(() => {
                    const amount = (sendAccountBalance?.value ?? 0n) + value
                    console.log('amount', amount)
                    return formatAmount(formatUnits(amount, coin?.decimals ?? 0))
                  })()} {coin?.symbol}.
                </Paragraph>
              </Fade>
            ) : null}
            <SubmitButton
              disabled={!canSubmit}
              iconAfter={isLoadingTx || isSubmitting ? <Spinner size="small" /> : undefined}
              onPress={() => {
                if (isDepositorEmpty) {
                  try {
                    assert(!!connectors[0], 'No connector found')
                    switchAccount({ connector: connectors[0] })
                  } catch (e) {
                    form.setError('root', {
                      type: 'custom',
                      message: `Failed to switch account. ${e?.message.split('.').at(0)}`,
                    })
                  }
                  return
                }
                submit()
              }}
              $gtSm={{ miw: 200 }}
              br={12}
            >
              <ButtonText col={'$color12'}>
                {(() => {
                  if (isLoadingTx) return ''
                  return 'Deposit'
                })()}
              </ButtonText>
            </SubmitButton>

            {hash && (
              <Link href={`${baseMainnet.blockExplorers.default.url}/tx/${hash}`} target="_blank">
                <ButtonText col={'$color12'}>
                  View {shorten(hash)} on {baseMainnet.blockExplorers.default.name}
                </ButtonText>
              </Link>
            )}
          </YStack>
        </FormWrapper.Body>
      )}
    >
      {({ token, amount }) => (
        <FormWrapper.Body testID="DepositWeb3ScreeFields">
          <XStack gap="$2" width={'100%'} f={1}>
            {token}
            <YStack gap="$2" width={'100%'} f={1}>
              {amount}
              {depositorBalance?.value !== undefined && !!coin ? (
                <Paragraph size="$3">
                  Balance:{' '}
                  {formatAmount(formatUnits(depositorBalance?.value ?? 0n, coin?.decimals ?? 0))}{' '}
                  {coin?.symbol}
                </Paragraph>
              ) : null}
            </YStack>
          </XStack>
        </FormWrapper.Body>
      )}
    </SchemaForm>
  )
}

const useDepositTransactionRequest = ({
  coin,
  value,
  account,
  sendAccount,
}: {
  coin?: coin
  value?: bigint
  account?: `0x${string}`
  sendAccount?: ReturnType<typeof useSendAccount>['data']
}) => {
  let data: `0x${string}` | undefined
  let to: `0x${string}`
  if (coin?.token !== 'eth') {
    data = encodeFunctionData({
      abi: erc20Abi,
      functionName: 'transfer',
      args: [sendAccount?.address ?? zeroAddress, value ?? 0n],
    })
    to = coin?.token ?? zeroAddress
  } else {
    to = sendAccount?.address ?? zeroAddress
  }
  return usePrepareTransactionRequest({
    chainId: baseMainnet.id,
    account,
    to,
    // @ts-expect-error wtf
    data,
    value,
    query: {
      enabled: !!sendAccount && (value ?? 0n) > 0n,
    },
  })
}
