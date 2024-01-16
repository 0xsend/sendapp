import { Button, styled } from '@my/ui'
import { INumpadButtonProps } from 'app/features/send/types'

const CustomButton = styled(Button, {
  name: 'CustomButton',
  borderRadius: 100_000_000,
  fontSize: '$6',
  width: '$8',
  height: '$8',
  variants: {
    num: {
      true: {
        backgroundColor: '$backgroundHover',
      },
    },
  },
  $shorter: {
    width: '$6',
    height: '$6',
  },
})

export function NumpadButton({ value, num, pressHandler, ...otherProps }: INumpadButtonProps) {
  return (
    <CustomButton num={num} onPress={() => pressHandler(value)} {...otherProps}>
      {value}
    </CustomButton>
  )
}
