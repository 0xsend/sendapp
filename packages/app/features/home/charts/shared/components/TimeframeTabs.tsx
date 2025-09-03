import { Button, ButtonText, XStack } from '@my/ui'
import { TIMEFRAMES, type Timeframe } from '../../shared/timeframes'

export function TimeframeTabs({
  value,
  onChange,
  isDark,
}: {
  value: Timeframe
  onChange: (tf: Timeframe) => void
  isDark?: boolean
}) {
  return (
    <XStack ai="center" jc="space-around" gap="$3" flexWrap="wrap">
      {TIMEFRAMES.map((label) => {
        const active = value === label
        return (
          <Button
            key={label}
            chromeless
            unstyled
            onPress={() => onChange(label)}
            borderBottomColor={isDark ? '$primary' : '$color12'}
            borderBottomWidth={active ? 1 : 0}
          >
            <ButtonText
              color={active ? '$color12' : '$silverChalice'}
              textTransform="uppercase"
              size={'$3'}
            >
              {label}
            </ButtonText>
          </Button>
        )
      })}
    </XStack>
  )
}
