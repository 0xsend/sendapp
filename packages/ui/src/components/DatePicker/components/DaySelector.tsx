import { type DPDay, useDatePickerContext } from '@rehookify/datepicker'
import { useMemo } from 'react'
import { Button, Text, View } from 'tamagui'
import { swapOnClick } from '../utils'

export const DaySelector = () => {
  const {
    data: { calendars, weekDays },
    propGetters: { dayButton },
  } = useDatePickerContext()

  const { days } = calendars[0] || {}

  const subDays = useMemo(
    () =>
      days?.reduce((acc, day, i) => {
        if (i % 7 === 0) {
          acc.push([])
        }
        acc[acc.length - 1]?.push(day)
        return acc
      }, [] as DPDay[][]),
    [days]
  )

  return (
    <View>
      <View flexDirection="row" gap="$1" marginBottom="$1">
        {weekDays.map((day) => (
          <Text key={day} ta="center" width={45} fontSize="$4">
            {day}
          </Text>
        ))}
      </View>
      <View flexDirection="column" gap="$1" flexWrap="wrap">
        {subDays?.map((days) => {
          return (
            <View
              flexDirection="row"
              key={days[0]?.$date.toString()}
              gap="$1"
              justifyContent="space-between"
            >
              {days.map((day) => (
                <Button
                  key={day.$date.toString()}
                  chromeless
                  circular
                  padding={0}
                  width={45}
                  {...swapOnClick(dayButton(day))}
                  backgroundColor={day.selected ? '$primary' : 'transparent'}
                  themeInverse={day.selected}
                  disabled={!day.inCurrentMonth}
                >
                  <Button.Text
                    color={
                      day.selected ? '$black' : day.inCurrentMonth ? '$white' : '$silverChalice'
                    }
                    fontWeight={day.inCurrentMonth ? '500' : '400'}
                  >
                    {day.day}
                  </Button.Text>
                </Button>
              ))}
            </View>
          )
        })}
      </View>
    </View>
  )
}
