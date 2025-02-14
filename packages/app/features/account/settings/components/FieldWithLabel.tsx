import { Paragraph, XStack, YStack, type YStackProps } from '@my/ui'

export const FieldWithLabel = ({
  label,
  children,
  additionalInfo,
  ...props
}: {
  label: string
  additionalInfo?: string
} & YStackProps) => {
  return (
    <YStack gap={'$1'} flexGrow={1} {...props}>
      <XStack ai={'center'} jc={'space-between'}>
        <Paragraph
          size={'$5'}
          color={'$lightGrayTextField'}
          $theme-light={{ color: '$darkGrayTextField' }}
        >
          {label}
        </Paragraph>
        <Paragraph
          size={'$5'}
          color={'$lightGrayTextField'}
          $theme-light={{ color: '$darkGrayTextField' }}
        >
          {additionalInfo}
        </Paragraph>
      </XStack>
      {children}
    </YStack>
  )
}
