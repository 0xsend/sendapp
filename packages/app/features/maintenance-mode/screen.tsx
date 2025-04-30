import { IconSendLogo } from 'app/components/icons'
import type { ReactNode } from 'react'
import { YStack, H1, H2 } from 'tamagui'

/**
 * This screen is used to display a maintenance mode screen.
 *
 * TODO: this will not work on native, add an API route to check for maintenance mode
 */
export function MaintenanceModeScreen({ children }: { children: ReactNode }) {
  if (process.env.NEXT_PUBLIC_MAINTENANCE_MODE === 'true') {
    return (
      <YStack
        p="$4"
        ai="center"
        jc="center"
        w="100%"
        h="100%"
        $gtMd={{
          p: '$6',
          ai: 'flex-start',
          jc: 'flex-start',
        }}
      >
        <IconSendLogo size={'$2.5'} color="$color12" />
        <H1 $gtMd={{ size: '$8' }} size="$4" fontWeight={'300'} color="$color12">
          currently undergoing maintenance
        </H1>
        <H2 $gtMd={{ size: '$6' }} size="$4" fontWeight={'300'} color="$color12">
          We will be back shortly!
        </H2>
      </YStack>
    )
  }
  return children
}
