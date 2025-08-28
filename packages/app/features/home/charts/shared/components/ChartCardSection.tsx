import { Card, H4, Spinner, YStack } from '@my/ui'

export function ChartCardSection({
  title,
  isLoading,
  children,
}: {
  title: string
  isLoading: boolean
  children: React.ReactNode
}) {
  return (
    <YStack gap={'$3'}>
      <H4 fontWeight={600} size={'$7'}>
        {title}
      </H4>
      <Card padded size={'$5'} w={'100%'} elevation={'$0.75'}>
        <YStack gap={'$3'} position="relative">
          {children}
          {isLoading ? (
            <YStack
              position="absolute"
              left={0}
              top={0}
              right={0}
              bottom={0}
              ai="center"
              jc="center"
              pointerEvents="none"
            >
              <Spinner size="small" color={'$color12'} />
            </YStack>
          ) : null}
        </YStack>
      </Card>
    </YStack>
  )
}
