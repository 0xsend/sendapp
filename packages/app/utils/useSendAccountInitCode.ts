import { useQuery } from '@tanstack/react-query'
import { SendAccountQuery } from './send-accounts/useSendAccounts'
import { useBytecode } from 'wagmi'
import { assert } from './assert'

/**
 * Given a Send Account, returns the init code for the account or null if the account is already initialized.
 */
export function useSendAccountInitCode({
  sendAccount,
}: {
  sendAccount?: SendAccountQuery
}) {
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
  })

  const isFetched = Boolean(sendAccount?.address && byteCodeIsFetched && byteCodeIsSuccess)

  return useQuery({
    queryKey: ['sendAccountInitCode', sendAccount?.address],
    enabled: !!byteCodeError || isFetched,
    queryFn: () => {
      if (byteCodeError) {
        throw byteCodeError
      }
      if (byteCode === null && isFetched) {
        // uninitialized account
        assert(!!sendAccount?.init_code, 'No init code for uninitialized account')
        return sendAccount.init_code
      }
      return null // initialized account
    },
  })
}
