import { Nav, styled, type YStackProps } from 'tamagui'

const StyledSideBar = styled(Nav, { name: 'Surface' })

export const SideBar = ({ children, ...props }: YStackProps) => {
  return (
    <StyledSideBar
      bc={props.bc ?? props.backgroundColor ?? '$background'}
      h={props.h ?? props.height ?? '100%'}
      width={props.w ?? props.width ?? '20%'}
      py={props.py ?? props.paddingVertical ?? '$6'}
      zi={props.zi ?? props.zIndex ?? 1}
      jc={props.jc ?? props.justifyContent ?? 'space-between'}
      ai={props.ai ?? props.alignItems ?? 'center'}
      mih={props.mih ?? props.minHeight ?? 524}
      miw={props.miw ?? props.minWidth ?? 395}
      {...props}
    >
      {children}
    </StyledSideBar>
  )
}
