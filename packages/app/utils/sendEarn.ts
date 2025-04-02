import { usdcAddress, sendEarnUsdcFactoryAddress } from '@my/wagmi'

export type SendEarnAsset = `0x${string}`

/**
 * Maps asset addresses to the Send Earn Factory chainId -> addresses.
 */
export const assetsToEarnFactory = Object.fromEntries([
  ...Object.entries(usdcAddress).map(([chainId, addr]) => [
    addr,
    sendEarnUsdcFactoryAddress[chainId],
  ]),
  // TODO: add other Send Earn factory addresses
]) as Record<SendEarnAsset, `0x${string}`>

/**
 * Checks if the given asset is a supported Send Earn asset which essentially means
 * it has a Send Earn Factory address.
 */
export function isSupportedAsset(asset: `0x${string}`): asset is SendEarnAsset {
  return assetsToEarnFactory[asset] !== undefined
}
