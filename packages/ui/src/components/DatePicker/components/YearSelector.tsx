import { useDatePickerContext } from '@rehookify/datepicker'
import { Button, View } from 'tamagui'
import { swapOnClick } from '../utils'

export const YearSelector = ({ onChange }: { onChange?: () => void }) => {
  const {
    data: { years, calendars },
    propGetters: { yearButton },
  } = useDatePickerContext()

  const selectedYear = calendars[0]?.year

  return (
    <View
      flexDirection="row"
      flexWrap="wrap"
      gap="$2"
      width={'100%'}
      maxWidth={280}
      justifyContent="space-between"
    >
      {years.map((year) => (
        <Button
          themeInverse={year.year === Number(selectedYear)}
          borderRadius="$true"
          flexBasis="30%"
          flexGrow={1}
          backgroundColor={year.year === Number(selectedYear) ? '$primary' : 'transparent'}
          key={year.$date.toString()}
          chromeless
          padding={0}
          {...swapOnClick(
            yearButton(year, {
              onClick: onChange,
            })
          )}
          hoverStyle={{
            backgroundColor: year.year === Number(selectedYear) ? '$olive' : '$color2',
          }}
        >
          <Button.Text color={year.year === Number(selectedYear) ? '$black' : '$color12'}>
            {year.year}
          </Button.Text>
        </Button>
      ))}
    </View>
  )
}
