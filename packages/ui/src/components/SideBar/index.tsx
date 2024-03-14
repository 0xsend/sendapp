import { YStack, YStackProps } from 'tamagui'

export const SideBar = ({ children, ...props }: YStackProps) => {
  return (
    <YStack
      h={props.h ?? props.height ?? '100%'}
      width={props.w ?? props.width ?? '20%'}
      py={props.py ?? props.paddingVertical ?? '$6'}
      zi={props.zi ?? props.zIndex ?? 1}
      jc={props.jc ?? props.justifyContent ?? 'space-between'}
      ai={props.ai ?? props.alignItems ?? 'center'}
      mih={props.mih ?? props.minHeight ?? 524}
      miw={props.miw ?? props.minWidth ?? 395}
      br={props.br ?? props.borderRadius ?? '$8'}
      {...props}
    >
      {children}
    </YStack>
  )
}
