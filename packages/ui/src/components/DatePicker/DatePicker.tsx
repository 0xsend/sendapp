import { useState } from 'react'
import { Popover, styled, View } from 'tamagui'
import { type DatePickerProps, SelectorType } from './types'
import { CalendarBody, CalendarHeader, DatePickerPopover } from './components'

const DatePickerContent = styled(Popover.Content, {
  animation: [
    '100ms',
    {
      opacity: {
        overshootClamping: true,
      },
    },
  ],
  variants: {
    unstyled: {
      false: {
        padding: 12,
        borderWidth: 1,
        borderColor: '$borderColor',
        enterStyle: { y: -10, opacity: 0 },
        exitStyle: { y: -10, opacity: 0 },
        elevate: true,
        shadowOpacity: 0.4,
        shadowRadius: 24,
      },
    },
  } as const,
  defaultVariants: {
    unstyled: process.env.TAMAGUI_HEADLESS === '1',
  },
})

export function DatePicker({ onChange, value, children }: DatePickerProps) {
  const [open, setOpen] = useState(false)
  const [selectorType, setSelectorType] = useState<SelectorType>(SelectorType.Day)

  const handleChange = (value: Date) => {
    setOpen(false)
    onChange(value)
  }

  return (
    <DatePickerPopover
      keepChildrenMounted
      open={open}
      onOpenChange={setOpen}
      value={value}
      onChange={handleChange}
    >
      <Popover.Trigger asChild>{children}</Popover.Trigger>
      <DatePickerContent>
        <Popover.Arrow />
        <View flexDirection="column" alignItems="center" gap="$2.5" maxWidth={325}>
          <CalendarHeader selectorType={selectorType} setSelectorType={setSelectorType} />
          <CalendarBody selectorType={selectorType} setSelectorType={setSelectorType} />
        </View>
      </DatePickerContent>
    </DatePickerPopover>
  )
}
