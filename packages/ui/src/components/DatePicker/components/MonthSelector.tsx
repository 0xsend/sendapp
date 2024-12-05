import { useDatePickerContext } from '@rehookify/datepicker'
import { Button, View } from 'tamagui'
import { swapOnClick } from '../utils'

export const MonthSelector = ({ onChange }: { onChange?: () => void }) => {
  const {
    data: { months },
    propGetters: { monthButton },
  } = useDatePickerContext()

  return (
    <View
      flexDirection="row"
      flexWrap="wrap"
      gap="$2"
      flexGrow={0}
      $platform-native={{
        justifyContent: 'space-between',
        width: '100%',
      }}
      $gtXs={{ width: 285 }}
    >
      {months.map((month) => (
        <Button
          themeInverse={month.active}
          borderRadius="$true"
          flexShrink={0}
          flexBasis={90}
          backgroundColor={month.active ? '$primary' : 'transparent'}
          key={month.$date.toString()}
          chromeless
          padding={0}
          {...swapOnClick(
            monthButton(month, {
              onClick: onChange,
            })
          )}
        >
          <Button.Text color={month.active ? '$black' : '$white'}>{month.month}</Button.Text>
        </Button>
      ))}
    </View>
  )
}
