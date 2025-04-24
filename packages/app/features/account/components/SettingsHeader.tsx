import { Button, XStack } from '@my/ui'
import { IconX } from 'app/components/icons'
import type { PropsWithChildren } from 'react'
import { useRouter } from 'solito/router'
import { RowLabel } from 'app/components/layout/RowLabel'

export const SettingsHeader = ({ children }: PropsWithChildren) => {
  const { push } = useRouter()

  const handleClosePress = () => {
    push('/account')
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
        height={'auto'}
        p={0}
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
