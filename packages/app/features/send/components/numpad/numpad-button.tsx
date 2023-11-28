import { Button, ButtonProps, styled } from "@my/ui"

const CustomButton = styled(Button, {
  name: "CustomButton",
  borderRadius: 100_000_000,
  fontSize: "$6",
  width: "$8",
  height: "$8",
  variants: {
    num: {
      true: {
        backgroundColor: "$backgroundHover",
      },
    }
  }
})

interface INumpadButtonProps extends ButtonProps {
  value: string,
  num?: boolean,
  pressHandler: (val: string) => void
}

export function NumpadButton({ value, num, pressHandler, ...otherProps }: INumpadButtonProps) {
  return (
    <CustomButton num={num} onPress={(e: any) => pressHandler(value)} {...otherProps}>
      {value}
    </CustomButton>
  )
}