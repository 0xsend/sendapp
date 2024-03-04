import { Paragraph, Spinner } from '@my/ui'
import { baseMainnet } from '@my/wagmi'
import formatAmount from 'app/utils/formatAmount'
import { useSendAccounts } from 'app/utils/send-accounts'
import { useBalance } from 'wagmi'

const TokenDetails = ({ tokenAddress }: { tokenAddress: `0x${string}` | undefined }) => {
  const { data: sendAccounts } = useSendAccounts()
  const sendAccount = sendAccounts?.[0]

  const balance = useBalance({
    address: sendAccount?.address,
    token: tokenAddress,
    query: { enabled: !!sendAccount },
    chainId: baseMainnet.id,
  })

  if (balance) {
    if (balance.isError) {
      throw new Error(`Error occurred while fetching balance. ${balance.error.message}`)
    }
    if (balance.isPending) {
      return <Spinner size={'small'} />
    }
    if (balance?.data?.value === undefined) {
      return <></>
    }
    return (
      <Paragraph fontSize={'$9'} fontWeight={'500'} color={'$color12'}>
        {formatAmount(
          (Number(balance.data.value) / 10 ** (balance.data?.decimals ?? 0)).toString()
        )}
      </Paragraph>
    )
  }
}

export default TokenDetails
