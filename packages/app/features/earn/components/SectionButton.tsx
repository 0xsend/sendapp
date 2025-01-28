import { Button } from '@my/ui'

export const SectionButton = ({ text, onPress }: { text: string; onPress: () => void }) => {
  return (
    <Button
      theme={'green'}
      br={'$4'}
      fontFamily={'$mono'}
      fontSize={'$5'}
      p={'$5'}
      fontWeight={'500'}
      color={'$black'}
      onPress={onPress}
    >
      {text}
    </Button>
  )
}
