import { Stack, Theme, type StackProps } from '@my/ui'

import { useAccount } from 'wagmi'
import { useConnectModal } from '@rainbow-me/rainbowkit'

export const OpenConnectModalWrapper = ({ children, ...props }: StackProps) => {
  const { address } = useAccount()
  const { openConnectModal } = useConnectModal()

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
