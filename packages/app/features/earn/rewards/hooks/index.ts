import { sendEarnAffiliateAbi } from '@0xsend/send-earn-contracts'
import { useMyAffiliateRewards } from 'app/features/earn/hooks'
import { assert } from 'app/utils/assert'
import { useSendAccount } from 'app/utils/send-accounts'
import { throwIf } from 'app/utils/throwIf'
import type { SendAccountCall } from 'app/utils/userop'
import debug from 'debug'
import { encodeFunctionData } from 'viem'
import { useQuery, type UseQueryReturnType } from 'wagmi/query'

const log = debug('app:features:earn:rewards')

/**
 * Hook to create a send account calls for claiming affiliate rewards from
 * Send Earn vaults.
 *
 * It will return send account calls for withdrawing affiliate rewards from a Send Earn vault.
 *
 * @param {Object} params - The claim parameters
 * @param {string} params.sender - The address of the sender
 * @returns {UseQueryReturnType<SendAccountCall[], Error>} The SendAccountCalls
 */
export function useSendEarnClaimRewardsCalls({
  sender,
}: {
  sender: `0x${string}` | undefined
}): UseQueryReturnType<SendAccountCall[] | null> {
  const affiliateRewards = useMyAffiliateRewards()
  const sendAccount = useSendAccount()

  return useQuery({
    queryKey: ['sendEarnClaimRewardsCalls', { sender, affiliateRewards, sendAccount }] as const,
    enabled: !affiliateRewards.isLoading && !sendAccount.isLoading && sender !== undefined,
    queryFn: async (): Promise<SendAccountCall[] | null> => {
      throwIf(affiliateRewards.error)
      throwIf(sendAccount.error)
      assert(sender !== undefined, 'Sender is not defined')

      if (affiliateRewards.isPending || !affiliateRewards.data) {
        log('No affiliate rewards found to claim')
        return null
      }

      const { shares, vault } = affiliateRewards.data

      // If there are no shares to claim or vault is null, return null
      if (shares <= 0n || !vault || !vault.send_earn_affiliate_vault) {
        log('No affiliate rewards to claim or invalid vault', { shares, vault })
        return null
      }

      log('Claiming affiliate rewards', { shares, vault })

      // For claiming rewards, we need to call the pay function on the send earn affilate contract
      // This will split the fees between the Platform and Affiliate, depositing it into
      // the payVault for the affiliate
      return [
        {
          dest: vault.send_earn_affiliate,
          value: 0n,
          data: encodeFunctionData({
            abi: sendEarnAffiliateAbi,
            functionName: 'pay',
            args: [vault.send_earn_affiliate_vault.send_earn],
          }),
        },
      ]
    },
  })
}
