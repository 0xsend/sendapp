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

interface INumPadButtonProps extends ButtonProps {
  num?: boolean,
}

export function NumPadButton(props: INumPadButtonProps) {
  return (
    <CustomButton {...props}>
      {props.children}
    </CustomButton>
  )
}