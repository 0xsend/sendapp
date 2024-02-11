import { UseQueryResult, useQuery } from '@tanstack/react-query'
import { SendAccountQuery } from './send-accounts/useSendAccounts'
import { useBytecode } from 'wagmi'
import { assert } from './assert'
import { isHex } from 'viem'
import { baseMainnet } from '@my/wagmi/chains'

/**
 * Given a Send Account, returns the init code for the account or null if the account is already initialized.
 */
export function useSendAccountInitCode({
  sendAccount,
}: {
  sendAccount?: SendAccountQuery
}): UseQueryResult<`0x${string}`> {
  const {
    data: byteCode,
    isFetched: byteCodeIsFetched,
    isSuccess: byteCodeIsSuccess,
    error: byteCodeError,
  } = useBytecode({
    address: sendAccount?.address,
    query: {
      enabled: !!sendAccount?.address,
    },
    chainId: baseMainnet.id,
  })

  const isFetched = Boolean(sendAccount?.address && byteCodeIsFetched && byteCodeIsSuccess)

  return useQuery({
    queryKey: ['sendAccountInitCode', sendAccount?.address, byteCodeError, isFetched, byteCode],
    enabled: !!byteCodeError || isFetched,
    queryFn: () => {
      if (byteCodeError) {
        throw byteCodeError
      }
      if (byteCode === null && isFetched) {
        // uninitialized account
        assert(!!sendAccount?.init_code, 'No init code for uninitialized account')
        const initCode = `0x${sendAccount.init_code.slice(2)}`
        assert(isHex(initCode), 'Invalid init code')
        return initCode
      }
      return '0x' // initialized account
    },
  })
}
