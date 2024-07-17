import { useMutation } from '@tanstack/react-query'
import {
  type Address,
  BaseError,
  type Chain,
  encodeAbiParameters,
  erc20Abi,
  getAbiItem,
  keccak256,
  pad,
  parseAbiParameters,
  type PublicActions,
  type TestClient,
  toHex,
  type Transport,
} from 'viem'

type SetErcBalanceParameters<TChain extends Chain | undefined> = {
  client: TestClient<'anvil', Transport, TChain> & PublicActions
  address: Address
  tokenAddress: Address
  value: bigint
}

const balanceOfAbiItem = getAbiItem({ abi: erc20Abi, name: 'balanceOf' })

// set guessed storage slot to odd value
// so it's obvious when checking balanceOf it was the right slot
const SLOT_VALUE_TO_CHECK = 1337_1337_1337_1337_1337_1337_1337_1337_1337n

/**
 * Hack to be able to set the storage of the balanceOf mapping
 * other than hardcoding the storage slot per address or reading source
 * we can guess the mapping slot and test against `balanceOf` result
 * by looping from 0. so check slot 0, calculate the slot via keccak
 * and verify that the value of the storage slot is the same as the balanceOf call
 */
export function useSetErc20Balance<TChain extends Chain | undefined>() {
  return useMutation({
    mutationFn: setERC20Balance<TChain>,
  })
}

export async function setERC20Balance<TChain extends Chain | undefined>({
  client,
  tokenAddress,
  address,
  value,
}: SetErcBalanceParameters<TChain>) {
  // TODO: Compose storage slot manipulation into an action.
  // See https://github.com/paradigmxyz/rivet/pull/50#discussion_r1322267280
  let slotFound = false
  let slotGuess = 0n

  while (slotFound !== true) {
    // if mapping, use keccak256(abi.encode(address(key), uint(slot)));
    const encodedData = encodeAbiParameters(parseAbiParameters('address, uint'), [
      address,
      slotGuess,
    ])

    const oldSlotValue = await client.getStorageAt({
      address: tokenAddress,
      slot: keccak256(encodedData),
    })

    // user value might be something that might have collision (like 0)
    await client.setStorageAt({
      address: tokenAddress,
      index: keccak256(encodedData),
      value: pad(toHex(SLOT_VALUE_TO_CHECK)),
    })

    const newBalance = await client.readContract({
      abi: [balanceOfAbiItem],
      address: tokenAddress,
      functionName: 'balanceOf',
      args: [address],
    })

    const guessIsCorrect = newBalance === BigInt(SLOT_VALUE_TO_CHECK)

    if (guessIsCorrect) {
      slotFound = true
      await client.setStorageAt({
        address: tokenAddress,
        index: keccak256(encodedData),
        value: pad(toHex(value)),
      })
    } else {
      // check for a rebasing token (stETH)
      // by setting storage value again with an offset
      await client.setStorageAt({
        address: tokenAddress,
        index: keccak256(encodedData),
        value: pad(toHex(SLOT_VALUE_TO_CHECK + 1n)),
      })
      const newBalanceAgain = await client.readContract({
        abi: [balanceOfAbiItem],
        address: tokenAddress,
        functionName: 'balanceOf',
        args: [address],
      })

      // the diff in balanceOf is the offset in value
      if (newBalanceAgain - newBalance === 1n) {
        slotFound = true
        await client.setStorageAt({
          address: tokenAddress,
          index: keccak256(encodedData),
          value: pad(toHex(value)),
        })
        break
      }

      // reset storage slot
      await client.setStorageAt({
        address: tokenAddress,
        index: keccak256(encodedData),
        value: oldSlotValue || pad('0x0'),
      })

      // loop
      slotGuess++
      if (slotGuess >= 10n) throw new BaseError('could not find storage for: `balanceOf`')
    }
  }
}
