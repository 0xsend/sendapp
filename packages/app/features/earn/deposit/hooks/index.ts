import { sendEarnFactoryAbi } from '@0xsend/send-earn-contracts'
import { sendEarnAbi } from '@my/wagmi'
import { useSendEarnBalances } from 'app/features/earn/hooks'
import { AffiliateVaultSchema } from 'app/features/earn/zod'
import { assert } from 'app/utils/assert'
import { hexToBytea } from 'app/utils/hexToBytea'
import { useReferredBy, useReferrer } from 'app/utils/referrer'
import { useSendAccount } from 'app/utils/send-accounts'
import { assetsToEarnFactory, isSupportedAsset } from 'app/utils/sendEarn'
import { useSupabase } from 'app/utils/supabase/useSupabase'
import { throwIf } from 'app/utils/throwIf'
import type { SendAccountCall } from 'app/utils/userop'
import debug from 'debug'
import { getRandomBytes } from 'expo-crypto'
import { bytesToHex, encodeFunctionData, erc20Abi, isAddressEqual, zeroAddress } from 'viem'
import { useChainId, useReadContract } from 'wagmi'
import { useQuery, type UseQueryReturnType } from 'wagmi/query'

const log = debug('app:features:earn')

/**
 * Fetches the referrer's vault address from the send_earn_new_affiliate table.
 */
export function useReferrerVault(): UseQueryReturnType<`0x${string}` | null> {
  const supabase = useSupabase()
  const referrer = useReferrer()
  const referredBy = useReferredBy()

  return useQuery({
    queryKey: ['referrerVault', { supabase, referredBy, referrer }] as const,
    queryFn: async ({
      queryKey: [, { supabase, referredBy, referrer }],
      signal,
    }): Promise<`0x${string}` | null> => {
      throwIf(referredBy.isError)
      throwIf(referrer.isError)
      // use referredBy ahead of referrer
      const address = ([referredBy.data?.address, referrer.data?.address] as const).find((a) => a)
      if (!address) return null
      const { data, error } = await supabase
        .from('send_earn_new_affiliate')
        .select('affiliate, send_earn_affiliate, send_earn_affiliate_vault(send_earn, log_addr)')
        .not('send_earn_affiliate_vault', 'is', null)
        .eq('affiliate', hexToBytea(address))
        .abortSignal(signal)
        .limit(1)
        .maybeSingle()

      if (error) {
        log('Error fetching referrer vault:', error)
        throw error
      }

      const affiliateVault = AffiliateVaultSchema.parse(data)

      return affiliateVault?.send_earn_affiliate_vault?.send_earn ?? null
    },
    enabled: referredBy.isFetched && referrer.isFetched,
  })
}

/**
 * Determine the vault to deposit into.
 *
 * Priority order:
 * 1. If the user has existing deposits, use their current vault
 * 2. If there's a referrer vault, use that
 * 3. Otherwise, return null
 *
 * @returns A query result containing the vault address to deposit into
 */
export function useSendEarnDepositVault({
  asset,
}: { asset: `0x${string}` | undefined }): UseQueryReturnType<`0x${string}` | null> {
  const referrerVault = useReferrerVault()
  const balances = useSendEarnBalances()
  const sendAccount = useSendAccount()
  const factory = useSendEarnFactory({ asset })
  const factoryDepositVault = useReadContract({
    address: factory.data,
    abi: sendEarnFactoryAbi,
    functionName: 'deposits',
    args: sendAccount.data?.address ? [sendAccount.data.address] : undefined,
    query: {
      enabled: factory.isFetched,
    },
  })

  log('useSendEarnDepositVault', {
    referrerVault,
    balances,
    sendAccount,
    asset,
    factory,
    factoryDepositVault,
  })

  return useQuery({
    queryKey: [
      'sendEarnDepositVault',
      {
        referrerVault,
        balances,
        sendAccount,
        asset,
        factoryDepositVault,
        factory,
      },
    ] as const,
    enabled:
      asset !== undefined &&
      balances.isFetched &&
      referrerVault.isFetched &&
      sendAccount.isFetched &&
      factory.isFetched &&
      factoryDepositVault.isFetched,
    queryFn: async ({
      queryKey: [, { referrerVault, balances, sendAccount, asset, factoryDepositVault }],
    }) => {
      throwIf(referrerVault.error)
      throwIf(balances.error)
      throwIf(sendAccount.error)
      throwIf(factory.error)
      throwIf(factoryDepositVault.error)
      assert(asset !== undefined, 'Asset is not defined')
      assert(!!sendAccount.data?.address, 'Send account address not available') // Explicit boolean check

      // 1. Check factory deposit vault first
      const factoryVaultAddr = factoryDepositVault.data
      if (factoryVaultAddr && !isAddressEqual(factoryVaultAddr, zeroAddress)) {
        log('Found deposit vault in factory. Using factory vault:', factoryVaultAddr)
        return factoryVaultAddr
      }

      // 2. Check existing balances (only if factory vault is zero)
      const userBalances = Array.isArray(balances.data)
        ? balances.data.filter(
            (balance) => balance.assets !== null && balance.assets > 0 && balance.log_addr !== null
          )
        : []

      if (userBalances.length > 0 && userBalances[0]?.log_addr) {
        const addr = userBalances[0].log_addr
        log('Factory vault is zero. Found existing balance. Using balance vault:', addr)
        return addr
      }

      // 3. Check referrer vault (only if factory and balances are zero/empty)
      if (referrerVault.data) {
        log(
          'Factory vault and balances are zero. User has a referrer. Using referrer vault:',
          referrerVault.data
        )
        return referrerVault.data
      }

      // 4. Fallback. This means use factory.createAndDeposit
      log('No factory vault, no existing balances, and no referrer.')
      return null
    },
  })
}

/**
 * Hook to create a send account calls for depositing Send Account assets into
 * Send Earn vaults.
 *
 * It will return send account calls for depositing USDC tokens into a Send Earn vault.
 *
 * Which vault depends on the asset, the referrer, and if the user has existing deposits.
 *
 * @param {Object} params - The deposit parameters
 * @param {string} params.asset - The address of the ERC20 token to deposit
 * @param {bigint} params.amount - The amount of tokens to deposit
 * @returns {UseQueryReturnType<UserOperation<'v0.7'>, Error>} The UserOperation
 */
export function useSendEarnDepositCalls({
  sender,
  asset,
  amount,
}: {
  sender: `0x${string}` | undefined
  asset: `0x${string}` | undefined
  amount: bigint | undefined
}): UseQueryReturnType<SendAccountCall[] | null> {
  const vault = useSendEarnDepositVault({ asset })
  const referrer = useReferrer()
  const factory = useSendEarnFactory({ asset })

  log('useSendEarnDepositCalls', { sender, asset, amount, vault, referrer, factory })

  return useQuery({
    queryKey: [
      'sendEarnDepositCalls',
      { sender, asset, amount, vault, referrer, factory },
    ] as const,
    enabled:
      vault.isFetched &&
      referrer.isFetched &&
      factory.isFetched &&
      asset !== undefined &&
      amount !== undefined,
    queryFn: async (): Promise<SendAccountCall[] | null> => {
      throwIf(vault.error)
      throwIf(referrer.error)
      throwIf(factory.error)
      assert(!!factory.data, 'Factory data is not defined')
      assert(asset !== undefined, 'Asset is not defined')
      assert(amount !== undefined, 'Amount is not defined')
      if (vault.isPending) return null

      if (vault.data) {
        // use deposit vault if it exists, user is already onboarded
        log('using deposit vault')
        return [
          {
            dest: asset,
            value: 0n,
            data: encodeFunctionData({
              abi: erc20Abi,
              functionName: 'approve',
              args: [vault.data, amount],
            }),
          },
          {
            dest: vault.data,
            value: 0n,
            data: encodeFunctionData({
              abi: sendEarnAbi,
              functionName: 'deposit',
              args: [amount, sender ?? zeroAddress],
            }),
          },
        ]
      }

      log('No existing deposits', { referrer: referrer.data?.address, factory: factory.data })
      // zero address means no referrer, use default vault for deposit (factory will handle this for us onchain)
      const referrerAddr = referrer.data?.address ?? zeroAddress
      const salt = bytesToHex(getRandomBytes(32))
      return [
        {
          dest: asset,
          value: 0n,
          data: encodeFunctionData({
            abi: erc20Abi,
            functionName: 'approve',
            args: [factory.data, amount],
          }),
        },
        {
          dest: factory.data,
          value: 0n,
          data: encodeFunctionData({
            abi: sendEarnFactoryAbi,
            functionName: 'createAndDeposit',
            args: [referrerAddr, salt, amount],
          }),
        },
      ]
    },
  })
}

/**
 * Fetches the Send Earn Factory address for the given asset. If the asset is not supported, it will throw an error.
 */
function useSendEarnFactory({
  asset,
}: { asset: `0x${string}` | undefined }): UseQueryReturnType<`0x${string}`> {
  const chainId = useChainId()
  return useQuery({
    enabled: asset !== undefined,
    queryKey: ['sendEarnFactory', { asset, chainId }] as const,
    queryFn: async ({ queryKey: [, { asset }] }): Promise<`0x${string}`> => {
      assert(asset !== undefined, 'Asset is not defined')
      assert(isSupportedAsset(asset), 'Asset is not supported')
      const factory = assetsToEarnFactory[asset]
      assert(!!factory, 'Asset is not supported')
      return factory
    },
  })
}
