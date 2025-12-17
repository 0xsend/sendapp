import { cloneElement, type PropsWithChildren, useState, useEffect } from 'react'
import { Stack, type StackProps } from '@my/ui'
import { isEligibleForWrapped, hasEnoughWrappedData } from '../utils/eligibility'
import { useWrappedData } from 'app/features/wrapped'
import { WrappedDialog } from './WrappedDialog'
import { useUser } from 'app/utils/useUser'
import { usePathname } from 'app/utils/usePathname'

interface WrappedSendIconProps extends StackProps {
  onPress?: () => void
}

/**
 * WrappedSendIcon component
 *
 * Shows the Send logo with special treatment for eligible users during wrapped season:
 * - Default: Standard Send logo
 * - Eligible + Data Ready: Green pulsing Send logo
 * - Click: Opens wrapped experience dialog/sheet
 */
export function WrappedEntry({
  onPress,
  children,
  ...props
}: PropsWithChildren<WrappedSendIconProps>) {
  const { profile } = useUser()
  const pathname = usePathname()
  const [dialogOpen, setDialogOpen] = useState(false)
  const [isColorToggled, setIsColorToggled] = useState(false)

  // Check eligibility
  const sendId = profile?.send_id
  const isEligible = isEligibleForWrapped(sendId)

  // Fetch wrapped data (only for eligible users)
  const { data: wrappedData, loading } = useWrappedData()

  // Only show on home page
  const isHomePage = pathname === '/' || pathname === '/home'

  // Determine if we should show the enhanced (pulsing) version
  const showEnhanced = isHomePage && isEligible && !loading && hasEnoughWrappedData(wrappedData)

  // Blinking color effect
  useEffect(() => {
    if (!showEnhanced) return

    const interval = setInterval(() => {
      setIsColorToggled((prev) => !prev)
    }, 1000) // Toggle every second

    return () => clearInterval(interval)
  }, [showEnhanced])

  const handlePress = () => {
    if (showEnhanced) {
      setDialogOpen(true)
    }
    onPress?.()
  }

  if (!showEnhanced) {
    return children
  }

  const standardChild = cloneElement(children, {
    color: '$color12',
  })

  const primaryChild = cloneElement(children, {
    color: '$primary',
  })

  return (
    <>
      <Stack
        cursor="pointer"
        onPress={handlePress}
        pressStyle={{
          opacity: 0.8,
          scale: 0.98,
        }}
        position="relative"
        {...props}
      >
        <Stack opacity={isColorToggled ? 0 : 1} animation="300ms">
          {standardChild}
        </Stack>
        <Stack
          position="absolute"
          top={0}
          left={0}
          right={0}
          bottom={0}
          opacity={isColorToggled ? 1 : 0}
          animation="300ms"
        >
          {primaryChild}
        </Stack>
      </Stack>

      {wrappedData && (
        <WrappedDialog open={dialogOpen} onOpenChange={setDialogOpen} wrappedData={wrappedData} />
      )}
    </>
  )
}
