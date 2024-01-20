import { Address, isAddress } from 'viem'

export const veryShortTag = (tag: string) => {
  if (tag.length < 7) {
    return tag
  }
  return tag.substring(0, 6).concat('...')
}
export const veryShortAddress = (address: Address) =>
  [address.substring(0, 3), address.substring(address.length - 1, address.length)].join('...')

export const shortTag = (tag: string) => {
  if (tag.length < 15) {
    return tag
  }
  return tag.substring(0, 15).concat('...')
}

export const shortAddress = (address?: Address) => {
  return address && isAddress(address)
    ? [address.substring(0, 4), address.substring(38, 42)].join('...')
    : undefined
}
