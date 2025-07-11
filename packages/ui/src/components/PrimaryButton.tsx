import {
  Button,
  ButtonIcon,
  type ButtonProps,
  type ParagraphProps,
  withStaticProperties,
} from 'tamagui'
import type { PropsWithChildren } from 'react'

export const _PrimaryButton = ({ disabled, children, ...props }: ButtonProps) => {
  return (
    <Button
      theme={'green'}
      elevation={disabled ? '$0.75' : undefined}
      alignSelf={'center'}
      w={'100%'}
      py={'$3'}
      br={'$4'}
      height={'auto'}
      bw={'$1'}
      disabledStyle={{ opacity: 0.5 }}
      disabled={disabled}
      {...props}
    >
      {children}
    </Button>
  )
}

export const PrimaryButtonText = ({ children, ...props }: PropsWithChildren & ParagraphProps) => {
  return (
    <Button.Text fontWeight={'500'} tt="uppercase" size={'$4'} color={'$black'} {...props}>
      {children}
    </Button.Text>
  )
}

export const PrimaryButton = withStaticProperties(_PrimaryButton, {
  Text: PrimaryButtonText,
  Icon: ButtonIcon,
})
