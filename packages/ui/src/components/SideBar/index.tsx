import { YStack, YStackProps } from 'tamagui'

export const SideBar = ({
  children,
  width,
  ...props
}: { children?: React.ReactNode } & YStackProps) => {
  return (
    <YStack
      height={'100svh'}
      width={width || '20%'}
      py="$6"
      zIndex={1}
      justifyContent="space-around"
      alignItems="center"
      mih={'524px'}
      {...props}
    >
      {children}
    </YStack>
  )
}

export { SideBarWrapper } from './Wrapper'
