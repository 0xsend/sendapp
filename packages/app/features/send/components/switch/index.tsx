import { Button, SizableText, XStack } from '@my/ui'
import { useThemeSetting } from '@tamagui/next-theme'

export interface ISwitchProps {
  leftText: string
  rightText: string
  leftHandler: () => void
  rightHandler: () => void
  active: 'left' | 'right'
}

export const Switch = ({
  leftText,
  rightText,
  leftHandler,
  rightHandler,
  active,
}: ISwitchProps) => {
  const { resolvedTheme } = useThemeSetting()

  const buttonInactiveProps = {
    backgroundColor: resolvedTheme === 'dark' ? '$black' : '$primary',
  }
  const textInactiveProps = {
    color: '$white',
  }
  const textActiveProps = {
    color: resolvedTheme === 'dark' ? '$primary' : '$color12',
    fontWeight: '700',
  }

  return (
    <XStack
      backgroundColor={resolvedTheme === 'dark' ? '$black' : '$primary'}
      borderRadius={'$7'}
      width={'100%'}
    >
      <Button
        flexBasis={'50%'}
        borderRadius={'$7'}
        borderWidth={'$1'}
        borderColor={resolvedTheme === 'dark' ? '$black' : '$primary'}
        {...(active === 'left' ? {} : buttonInactiveProps)}
        onPress={leftHandler}
        focusable={false}
      >
        <SizableText {...(active === 'left' ? textActiveProps : textInactiveProps)}>
          {leftText}
        </SizableText>
      </Button>
      <Button
        flexBasis={'50%'}
        borderRadius={'$6'}
        borderWidth={'$1'}
        borderColor={resolvedTheme === 'dark' ? '$black' : '$primary'}
        {...(active === 'right' ? {} : buttonInactiveProps)}
        onPress={rightHandler}
        focusable={false}
      >
        <SizableText {...(active === 'right' ? textActiveProps : textInactiveProps)}>
          {rightText}
        </SizableText>
      </Button>
    </XStack>
  )
}
