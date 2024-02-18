import { YStack, YStackProps } from 'tamagui'

export const SideBar = ({
  children,
  width,
  ...props
}: { children?: React.ReactNode } & YStackProps) => {
  return (
    <YStack
      height={'95%'}
      width={width || '20%'}
      py="$6"
      ml="$7"
      my="auto"
      zIndex={1}
      justifyContent="space-around"
      alignItems="center"
      mih={524}
      miw={395}
      br={'$8'}
      {...props}
    >
      {children}
    </YStack>
  )
}

export { SideBarWrapper } from './Wrapper'
