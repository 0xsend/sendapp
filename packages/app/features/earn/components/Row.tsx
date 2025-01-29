import { Paragraph, XStack } from '@my/ui'

export const Row = ({
  label,
  value,
  overrideValue,
}: {
  label: string
  value: string
  overrideValue?: string
}) => {
  return (
    <XStack gap={'$2.5'} jc={'space-between'} flexWrap={'wrap'}>
      <Paragraph
        size={'$5'}
        color={'$lightGrayTextField'}
        $theme-light={{ color: '$darkGrayTextField' }}
      >
        {label}
      </Paragraph>
      <XStack gap={'$2.5'} flexWrap={'wrap'} flexShrink={1}>
        <Paragraph size={'$5'} textDecorationLine={overrideValue ? 'line-through' : 'none'}>
          {value}
        </Paragraph>
        {overrideValue && (
          <Paragraph size={'$5'} color={'$error'}>
            {overrideValue}
          </Paragraph>
        )}
      </XStack>
    </XStack>
  )
}
