import { Button, XStack } from '@my/ui'
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
      <Button
        onPress={handleClosePress}
        chromeless
        hoverStyle={{
          backgroundColor: 'transparent',
        }}
        pressStyle={{
          backgroundColor: 'transparent',
        }}
        focusStyle={{
          backgroundColor: 'transparent',
        }}
        display={'none'}
        $gtLg={{ display: 'flex' }}
      >
        <Button.Icon>
          <IconX
            size={'$1.5'}
            $theme-dark={{ color: '$primary' }}
            $theme-light={{ color: '$color12' }}
          />
        </Button.Icon>
      </Button>
    </XStack>
  )
}
