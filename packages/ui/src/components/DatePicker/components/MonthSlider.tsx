import { useDatePickerContext } from '@rehookify/datepicker'
import { Button, Text, View } from 'tamagui'
import { ChevronLeft, ChevronRight } from '@tamagui/lucide-icons'
import { swapOnClick } from '../utils'
import { SelectorType } from '../types'

export const MonthSlider = ({
  setSelectorType,
}: {
  setSelectorType: (selectorType: SelectorType) => void
}) => {
  const {
    data: { calendars },
    propGetters: { subtractOffset },
  } = useDatePickerContext()
  const { year, month } = calendars[0] || {}

  return (
    <View flexDirection="row" width="100%" alignItems="center" justifyContent="space-between">
      <Button circular size="$4" {...swapOnClick(subtractOffset({ months: 1 }))}>
        <Button.Icon scaleIcon={1.5}>
          <ChevronLeft />
        </Button.Icon>
      </Button>
      <View flexDirection="column" alignItems="center">
        <Text
          onPress={() => setSelectorType(SelectorType.Year)}
          fontSize="$4"
          cursor="pointer"
          hoverStyle={{
            color: '$silverChalice',
          }}
        >
          {year}
        </Text>
        <Text
          onPress={() => setSelectorType(SelectorType.Month)}
          cursor="pointer"
          fontSize="$6"
          fontWeight="600"
          hoverStyle={{
            color: '$silverChalice',
          }}
        >
          {month}
        </Text>
      </View>
      <Button circular size="$4" {...swapOnClick(subtractOffset({ months: -1 }))}>
        <Button.Icon scaleIcon={1.5}>
          <ChevronRight />
        </Button.Icon>
      </Button>
    </View>
  )
}
