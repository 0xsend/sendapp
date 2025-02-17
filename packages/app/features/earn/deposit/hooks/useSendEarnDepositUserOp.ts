import { sendEarnAbi } from '@my/wagmi'
import { useSendAccount } from 'app/utils/send-accounts'
import { useUserOp } from 'app/utils/userop'
import type { UserOperation } from 'permissionless'
import { useMemo } from 'react'
import { encodeFunctionData, erc20Abi } from 'viem'
import type { UseQueryReturnType } from 'wagmi/query'

/**
 * Hook to create a UserOperation for depositing Send Account assets into
 * Send Earn vaults.
 *
 * TODO: add support for referrals. MUST use the last referral and only one upline.
 * TODO: ensure the asset and vault are valid
 *
 * @param {Object} params - The deposit parameters
 * @param {string} params.asset - The address of the ERC20 token to deposit
 * @param {bigint} params.amount - The amount of tokens to deposit
 * @param {string} params.vault - The address of the Send Earn vault
 * @returns {UseQueryReturnType<UserOperation<'v0.7'>, Error>} The UserOperation
 */
export const useSendEarnDepositUserOp = ({
  asset,
  amount,
  vault,
}: {
  asset: `0x${string}`
  amount: bigint
  vault: `0x${string}`
}): UseQueryReturnType<UserOperation<'v0.7'>, Error> => {
  const sendAccount = useSendAccount()
  const sender = useMemo(() => sendAccount?.data?.address, [sendAccount?.data?.address])

  // TODO: validate asset
  // TODO: referrer logic and setting correct send earn vault address
  const calls = useMemo(
    () => [
      {
        dest: asset,
        value: 0n,
        data: encodeFunctionData({
          abi: erc20Abi,
          functionName: 'approve',
          args: [vault, amount],
        }),
      },
      {
        dest: vault,
        value: 0n,
        data: encodeFunctionData({
          abi: sendEarnAbi,
          functionName: 'deposit',
          args: [amount, sender ?? '0x'],
        }),
      },
    ],
    [asset, vault, amount, sender]
  )

  const uop = useUserOp({
    sender,
    calls,
  })

  return uop
}
