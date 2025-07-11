import {
  Button,
  ButtonIcon,
  type ButtonProps,
  type ParagraphProps,
  withStaticProperties,
  type TamaguiElement,
} from 'tamagui'
import type { PropsWithChildren } from 'react'
import { forwardRef } from 'react'

export const _PrimaryButton = forwardRef<TamaguiElement | null, ButtonProps>(
  ({ disabled, children, ...props }, ref) => {
    return (
      <Button
        ref={ref}
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
)

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
