import { Stack, XStack } from '@my/ui'
import { IconX } from 'app/components/icons'
import { RowLabel } from 'app/features/account/settings/components/RowLabel'
import type { PropsWithChildren } from 'react'
import { useRouter } from 'solito/router'

export const SettingsHeader = ({ children }: PropsWithChildren) => {
  const { push } = useRouter()

  const handleClosePress = () => {
    push('/account/settings')
  }

  return (
    <XStack jc={'space-between'} ai={'center'}>
      <RowLabel>{children}</RowLabel>
      <Stack
        onPress={handleClosePress}
        cursor={'pointer'}
        display={'none'}
        $gtLg={{ display: 'flex' }}
      >
        <IconX
          size={'$1.5'}
          $theme-dark={{ color: '$primary' }}
          $theme-light={{ color: '$color12' }}
        />
      </Stack>
    </XStack>
  )
}
