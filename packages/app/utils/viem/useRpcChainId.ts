import { useEffect, useState } from 'react'
import { usePublicClient } from 'wagmi'

/**
 * Fetches the chainId from the RPC endpoint.
 */
export const useRpcChainId = () => {
  const [chainId, setChainId] = useState<number | undefined>(undefined)
  const [error, setError] = useState<Error | undefined>(undefined)
  const publicClient = usePublicClient()

  useEffect(() => {
    if (publicClient) {
      publicClient.getChainId().then(setChainId).catch(setError)
    }
  }, [publicClient])

  return {
    data: chainId,
    isLoading: chainId === undefined,
    isError: !!error,
    error,
  }
}
