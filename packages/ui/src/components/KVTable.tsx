import { XStack, type XStackProps, YStack, type YStackProps, withStaticProperties } from 'tamagui'

const KVTableFrame = (props: YStackProps) => <YStack gap="$4" {...props} />

const KVTableRow = (props: XStackProps) => (
  <XStack $sm={{ flexDirection: 'column' }} gap="$2" flexWrap="wrap" {...props} />
)

const KVTableKey = (props: YStackProps) => <YStack width="23%" $sm={{ width: '100%' }} {...props} />

const KVTableValue = (props: YStackProps) => (
  <YStack width="72%" $sm={{ width: '100%' }} flexWrap="wrap" {...props} />
)

export const KVTable = withStaticProperties(KVTableFrame, {
  Row: KVTableRow,
  Key: KVTableKey,
  Value: KVTableValue,
})
