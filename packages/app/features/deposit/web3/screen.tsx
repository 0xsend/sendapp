import {
  Button,
  ButtonText,
  FormWrapper,
  H2,
  Paragraph,
  Spinner,
  SubmitButton,
  YStack,
} from '@my/ui'
import { baseMainnet } from '@my/wagmi'
import { useConnectModal } from '@rainbow-me/rainbowkit'
import { IconEthereum } from 'app/components/icons'
import { coins, type coin } from 'app/data/coins'
import { SchemaForm, formFields } from 'app/utils/SchemaForm'
import { assert } from 'app/utils/assert'
import { useSendAccount } from 'app/utils/send-accounts'
import { useForm } from 'react-hook-form'
import { Link } from 'solito/link'
import { encodeFunctionData, erc20Abi, parseEther, parseUnits, zeroAddress } from 'viem'
import { useAccount, usePrepareTransactionRequest } from 'wagmi'
import { z } from 'zod'

/**
 * Deposit from web3 wallet
 * 1. Connect to web3 wallet
 * 2. Select token USDC, ETH, or SEND and enter amount
 * 3. Sign transaction
 */
export function DepositWeb3Screen() {
  const { openConnectModal } = useConnectModal()
  const { isConnected } = useAccount()

  if (!isConnected) {
    return (
      <YStack>
        <Button
          icon={<IconEthereum size={'$2.5'} color={'$color12'} />}
          onPress={() => openConnectModal?.()}
        >
          Connect to Deposit
        </Button>
      </YStack>
    )
  }

  return <DepositForm />
}

const schema = z.object({
  amount: formFields.text.describe('Amount'),
  token: formFields.select.describe('Token'),
})

type DepositSchema = z.infer<typeof schema>

function DepositForm() {
  const form = useForm<DepositSchema>()
  const options = coins.map((coin) => ({ name: coin.symbol, value: coin.token }))
  const first = options[0]
  assert(!!first, 'first coin not found')

  const coin = coins.find((coin) => coin.token === form.watch('token'))
  const amount = form.watch('amount')
  const { address: account } = useAccount()
  const { data: sendAccount } = useSendAccount()
  const request = useDepositTransactionRequest({
    coin,
    amount,
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
  console.log('txData', txData)
  console.log('isLoadingTx', isLoadingTx)
  console.log('isFetchingTx', isFetchingTx)
  console.log('isFetchedTx', isFetchedTx)
  console.log('txError', txError)
  console.log('txError', txError)
  return (
    <SchemaForm
      form={form}
      onSubmit={console.log}
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
        <FormWrapper.Body pb="$4">
          <Link
            href={`${baseMainnet.blockExplorers.default.url}/address/${account}`}
            target="_blank"
            style={{ display: 'inline' }}
          >
            <H2 size={'$4'} fontWeight={'300'} color={'$color05'}>
              Depositing from {account}
            </H2>
          </Link>
        </FormWrapper.Body>
      )}
      renderAfter={({ submit }) => (
        <FormWrapper.Body>
          <YStack gap="$2">
            {txError && (
              <Paragraph color="red">
                {txError.message.split('.').at(0)}.{' '}
                {txError.name !== 'Error' ? txError.details?.split('.').at(0) : ''}
              </Paragraph>
            )}
            {isLoadingTx && <Spinner size="small" />}
            <SubmitButton onPress={submit} $gtSm={{ miw: 200 }} br={12}>
              <ButtonText col={'$color12'}>Deposit</ButtonText>
            </SubmitButton>
          </YStack>
        </FormWrapper.Body>
      )}
    />
  )
}

const useDepositTransactionRequest = ({
  coin,
  amount,
  account,
  sendAccount,
}: {
  coin?: coin
  amount?: string
  account?: `0x${string}`
  sendAccount?: ReturnType<typeof useSendAccount>['data']
}) => {
  let data: `0x${string}` | undefined
  let value = 0n
  let to: `0x${string}`
  if (coin?.token !== 'eth') {
    const value = parseUnits(amount ?? '0', coin?.decimals ?? 0)
    data = encodeFunctionData({
      abi: erc20Abi,
      functionName: 'transfer',
      args: [sendAccount?.address ?? zeroAddress, value],
    })
    to = coin?.token ?? zeroAddress
  } else {
    to = sendAccount?.address ?? zeroAddress
    value = parseEther(amount ?? '0')
  }
  return usePrepareTransactionRequest({
    chainId: baseMainnet.id,
    account,
    to,
    // @ts-expect-error wtf
    data,
    value,
    query: {
      enabled: !!sendAccount,
    },
  })
}
