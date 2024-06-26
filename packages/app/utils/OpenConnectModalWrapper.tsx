import { Stack, Theme, type StackProps } from '@my/ui'

import { useAccount } from 'wagmi'
import { useWeb3Modal } from '@web3modal/wagmi/react'

export const OpenConnectModalWrapper = ({ children, ...props }: StackProps) => {
  const { address } = useAccount()
  const { open: openConnectModal } = useWeb3Modal()

  const handleClick = (e) => {
    if (address || !openConnectModal) return
    e.stopPropagation()
    openConnectModal()
  }
  return (
    <Theme>
      <Stack onPress={handleClick} {...props}>
        {children}
      </Stack>
    </Theme>
  )
}
