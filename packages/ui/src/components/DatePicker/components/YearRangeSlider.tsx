import { useDatePickerContext } from '@rehookify/datepicker'
import { Button, Text, View } from 'tamagui'
import { ChevronLeft, ChevronRight } from '@tamagui/lucide-icons'
import { swapOnClick } from '../utils'

export const YearRangeSlider = () => {
  const {
    data: { years },
    propGetters: { previousYearsButton, nextYearsButton },
  } = useDatePickerContext()

  return (
    <View flexDirection="row" width="100%" alignItems="center" justifyContent="space-between">
      <Button circular size="$4" {...swapOnClick(previousYearsButton())}>
        <Button.Icon scaleIcon={1.5}>
          <ChevronLeft />
        </Button.Icon>
      </Button>
      <View flexDirection="column" alignItems="center">
        <Text fontSize="$5">{`${years[0]?.year} - ${years[years.length - 1]?.year}`}</Text>
      </View>
      <Button circular size="$4" {...swapOnClick(nextYearsButton())}>
        <Button.Icon scaleIcon={1.5}>
          <ChevronRight />
        </Button.Icon>
      </Button>
    </View>
  )
}
