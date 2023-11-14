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
    publicClient.getChainId().then(setChainId).catch(setError)
  }, [publicClient, setError])

  return {
    data: chainId,
    isLoading: chainId === undefined,
    isError: !!error,
    error,
  }
}
