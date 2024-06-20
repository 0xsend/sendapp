import {
  Button,
  ButtonText,
  Fade,
  FormWrapper,
  H2,
  Paragraph,
  Shake,
  Spinner,
  Stack,
  SubmitButton,
  XStack,
  YStack,
  isWeb,
} from '@my/ui'
import { baseMainnet, useWriteErc20Transfer } from '@my/wagmi'
import { useWeb3Modal } from '@web3modal/wagmi/react'
import { IconEthereum, IconRefresh } from 'app/components/icons'
import { IconChainBase } from 'app/components/icons/IconChainBase'
import { coins } from 'app/data/coins'
import { SchemaForm, formFields } from 'app/utils/SchemaForm'
import { assert } from 'app/utils/assert'
import formatAmount from 'app/utils/formatAmount'
import { useSendAccount } from 'app/utils/send-accounts'
import { shorten } from 'app/utils/strings'
import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { Link } from 'solito/link'
import { formatUnits, parseUnits } from 'viem'
import {
  useAccount,
  useBalance,
  useSendTransaction,
  useSwitchAccount,
  useWaitForTransactionReceipt,
} from 'wagmi'
import { z } from 'zod'

/**
 * Deposit from web3 wallet
 * 1. Connect to web3 wallet
 * 2. Select token USDC, ETH, or SEND and enter amount
 * 3. Sign transaction
 */
export function DepositWeb3Screen() {
  const { open: openConnectModal } = useWeb3Modal()
  const { isConnected, chainId, chain } = useAccount()
  // const { openChainModal } = useChainModal()

  useEffect(() => {
    if (!isConnected) {
      openConnectModal?.()
    }
  }, [isConnected, openConnectModal])

  if (!isConnected) {
    return (
      <Wrapper>
        <H2 size={'$8'} fontWeight={'300'} color={'$color05'}>
          Connect to Deposit
        </H2>
        <Paragraph size={'$6'} fontWeight={'300'} color={'$color05'}>
          You need to connect to a wallet to deposit funds.
        </Paragraph>
        <Button
          accessible
          icon={<IconEthereum size={'$1'} color={'$color12'} />}
          onPress={() => openConnectModal()}
          maxWidth={'$20'}
        >
          Connect to Deposit
        </Button>
      </Wrapper>
    )
  }

  if (chainId !== baseMainnet.id) {
    return (
      <Wrapper>
        <H2 size={'$8'} fontWeight={'300'} color={'$color05'}>
          Switch to {baseMainnet.name}
        </H2>
        <Paragraph size={'$6'} fontWeight={'300'} color={'$color05'}>
          You are currently on {chain?.name}. Switch to {baseMainnet.name} to deposit funds.
        </Paragraph>
        <Button
          accessible
          icon={<IconChainBase size={'$1'} />}
          onPress={() => openConnectModal({ view: 'Networks' })}
          maxWidth={'$20'}
        >
          Switch
        </Button>
      </Wrapper>
    )
  }

  return (
    <FailsafeChainId>
      <DepositForm />
    </FailsafeChainId>
  )
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
  const isCoinSelected = !!coin
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
    refetch: refetchDepositorBalance,
  } = useBalance({
    address: account,
    token: coin?.token === 'eth' ? undefined : coin?.token,
    query: { enabled: !!account && isCoinSelected },
    chainId: baseMainnet.id,
  })
  const isDepositorEmpty = depositorBalance?.value === 0n
  const {
    // helpful but not required for submitting
    data: sendAccountBalance,
    refetch: refetchSendAccountBalance,
  } = useBalance({
    address: sendAccount?.address,
    token: coin?.token === 'eth' ? undefined : coin?.token,
    query: { enabled: !!sendAccount && isCoinSelected },
    chainId: baseMainnet.id,
  })
  const { writeContractAsync } = useWriteErc20Transfer()
  const { sendTransactionAsync } = useSendTransaction()
  const [depositHash, setDepositHash] = useState<`0x${string}`>()
  const {
    data: receipt,
    isLoading: isLoadingReceipt,
    error: receiptError,
  } = useWaitForTransactionReceipt({
    hash: depositHash,
  })
  const canSubmit = !isLoadingReceipt

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

  // handle tx receipt error
  useEffect(() => {
    if (receiptError) {
      form.setError('root', {
        type: 'custom',
        message: receiptError.message.split('.').at(0),
      })
    }
    if (receipt?.status === 'reverted') {
      form.setError('root', {
        type: 'custom',
        message: 'Transaction failed',
      })
    }
    if (receipt) {
      refetchDepositorBalance()
      refetchSendAccountBalance()
    }
  }, [receiptError, form, receipt, refetchDepositorBalance, refetchSendAccountBalance])

  const onSubmit = async () => {
    if (!canSubmit) return
    try {
      assert(!!coin?.token, 'No coin selected')
      assert(!!sendAccount, 'No send account found')
      assert(value > 0n, 'Amount must be greater than 0')
      if (coin?.token === 'eth') {
        const hash = await sendTransactionAsync({
          to: sendAccount.address,
          value: value,
        })
        setDepositHash(hash)
      } else {
        const hash = await writeContractAsync({
          args: [sendAccount.address, value],
          address: coin.token,
        })
        setDepositHash(hash)
      }
      form.clearErrors('root')
      form.setValue('amount', '')
    } catch (e) {
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
        <FormWrapper.Body pb="$4" testID="DepositWeb3ScreenBefore">
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
        <FormWrapper.Body testID="DepositWeb3ScreenAfter">
          <YStack gap="$2">
            {form.formState.errors?.root?.message ? (
              <Shake>
                <Paragraph color="red" testID="DepositWeb3ScreenError">
                  {form.formState.errors?.root?.message}
                </Paragraph>
              </Shake>
            ) : null}
            {value > 0n ? (
              <Fade>
                <Paragraph size="$3">
                  After depositing, your Send Account balance will be {(() => {
                    const amount = (sendAccountBalance?.value ?? 0n) + value
                    return formatAmount(formatUnits(amount, coin?.decimals ?? 0))
                  })()} {coin?.symbol}.
                </Paragraph>
              </Fade>
            ) : null}

            <SubmitButton
              disabled={!canSubmit || isLoadingReceipt}
              iconAfter={isLoadingReceipt ? <Spinner size="small" /> : undefined}
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
                {isLoadingReceipt ? 'Depositing...' : 'Deposit'}
              </ButtonText>
            </SubmitButton>

            {receipt?.transactionHash && (
              <Link
                href={`${baseMainnet.blockExplorers.default.url}/tx/${receipt?.transactionHash}`}
                target="_blank"
              >
                <ButtonText col={'$color12'}>
                  View {shorten(receipt?.transactionHash)} on{' '}
                  {baseMainnet.blockExplorers.default.name}
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

function Wrapper({ children }: { children: React.ReactNode }) {
  return (
    <YStack gap="$4" mt="$6" width={'100%'} maxWidth={600} mr="auto">
      {children}
    </YStack>
  )
}

/**
 * This component is used to fail safely when the user is on the wrong network.
 * This happens when the window ethereum provider gets out of sync with the wagmi chainId.
 * @see https://discord.com/channels/1156791276818157609/1156791580938739822/1249030557489299558
 */
function FailsafeChainId({ children }: { children: React.ReactNode }) {
  const { chainId } = useAccount()
  const [failsafeChainId, setFailsafeChainId] = useState<number>()
  const [error, setError] = useState<string>()
  const [ignoreError, setIgnoreError] = useState(false)
  const { open: openWeb3Modal } = useWeb3Modal()

  // biome-ignore lint/correctness/useExhaustiveDependencies: hack
  useEffect(() => {
    if (isWeb) {
      window.ethereum
        .request({ method: 'eth_chainId' })
        .then((cid) => setFailsafeChainId(Number(cid)))
        .catch((e) => setError(e.message?.split('.').at(0) ?? e.toString()))
    }
  }, [chainId, openWeb3Modal])

  if (!isWeb) return children // we don't need to do anything on non-web

  if (failsafeChainId === undefined) {
    return (
      <Wrapper>
        <Stack width="100%" f={1} jc="center">
          <Spinner size="small" color="$accent10Dark" />
        </Stack>
      </Wrapper>
    )
  }

  if (!ignoreError && error) {
    return (
      <Wrapper>
        <H2 size={'$8'} fontWeight={'300'} color={'$color05'}>
          Error
        </H2>
        <Paragraph size={'$6'} fontWeight={'300'} color={'$color05'}>
          {error}
        </Paragraph>
        <Button
          accessible
          icon={<IconRefresh size={'$1'} />}
          onPress={() => {
            setError('')
            setIgnoreError(true)
          }}
          maxWidth={'$20'}
        >
          Continue anyway?
        </Button>
      </Wrapper>
    )
  }

  if (chainId !== failsafeChainId) {
    return (
      <Wrapper>
        <H2 size={'$8'} fontWeight={'300'} color={'$color05'}>
          Switch to {baseMainnet.name}
        </H2>
        <Paragraph size={'$6'} fontWeight={'300'} color={'$color05'}>
          You are on the wrong network. Switch to {baseMainnet.name} to deposit funds.
        </Paragraph>
        <Button
          accessible
          icon={<IconChainBase size={'$1'} />}
          onPress={() => openWeb3Modal({ view: 'Networks' })}
          maxWidth={'$20'}
        >
          Switch
        </Button>
      </Wrapper>
    )
  }

  return children
}
