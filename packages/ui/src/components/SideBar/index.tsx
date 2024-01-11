import { YStack, YStackProps } from '@my/ui'

export const SideBar = ({ children, ...props }: { children?: React.ReactNode } & YStackProps) => {
  return (
    <YStack
      $md={{ display: 'none' }}
      height={'100svh'}
      width={'20%'}
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

export * from './Wrapper'
