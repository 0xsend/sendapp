import { Paragraph, XStack } from '@my/ui'

export const Row = ({ label, value }: { label: string; value: string }) => {
  return (
    <XStack gap={'$2.5'} jc={'space-between'}>
      <Paragraph
        size={'$5'}
        color={'$lightGrayTextField'}
        $theme-light={{ color: '$darkGrayTextField' }}
      >
        {label}
      </Paragraph>
      <Paragraph size={'$5'}>{value}</Paragraph>
    </XStack>
  )
}
