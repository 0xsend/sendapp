import { Button, type ButtonProps } from '@my/ui'

export const SectionButton = ({ children, ...props }: ButtonProps) => {
  return (
    <Button
      theme={'green'}
      br={'$4'}
      fontFamily={'$mono'}
      fontSize={'$5'}
      p={'$5'}
      fontWeight={'500'}
      color={'$black'}
      disabledStyle={{ opacity: 0.5 }}
      {...props}
    >
      {children}
    </Button>
  )
}
