import { Paragraph, Spinner } from '@my/ui'
import { baseMainnet } from '@my/wagmi'
import formatAmount from 'app/utils/formatAmount'
import { useSendAccounts } from 'app/utils/send-accounts'
import { useEffect } from 'react'
import { useBalance } from 'wagmi'

const TokenDetails = ({ tokenAddress }: { tokenAddress: `0x${string}` }) => {
  const { data: sendAccounts } = useSendAccounts()
  const sendAccount = sendAccounts?.[0]

  const balance = useBalance({
    address: sendAccount?.address,
    token: tokenAddress,
    query: { enabled: !!sendAccount },
    chainId: baseMainnet.id,
  })

  // @TODO: add balance error check
  if (balance) {
    if (balance.isPending) {
      return <Spinner size={'small'} />
    }
    return (
      <Paragraph fontSize={'$9'} fontWeight={'500'} color={'$color12'}>
        {formatAmount(balance.data?.value.toString(), undefined, 3)}
      </Paragraph>
    )
  }
}

export default TokenDetails
