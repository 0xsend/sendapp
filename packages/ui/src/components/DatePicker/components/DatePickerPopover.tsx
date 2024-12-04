import type { DatePickerPopoverProps } from '../types'
import { useEffect, useRef, useCallback } from 'react'
import { Adapt, isWeb, Popover } from 'tamagui'
import { DatePickerProvider } from '@rehookify/datepicker'

export const DatePickerPopover = ({
  children,
  value,
  onChange,
  ...rest
}: DatePickerPopoverProps) => {
  const popoverRef = useRef<Popover>(null)

  const hideDatePickerOnScrollOnWeb = useCallback((controller: AbortController) => {
    if (isWeb) {
      document.body.addEventListener(
        'scroll',
        () => {
          popoverRef.current?.close()
        },
        {
          signal: controller.signal,
        }
      )
    }
  }, [])

  const onDatesChange = (value: Date[]) => {
    if (value[0]) {
      onChange(value[0])
    }
  }

  const config = {
    selectedDates: value ? [value] : [],
    onDatesChange,
    calendar: {
      startDay: 1 as const,
    },
  }

  useEffect(() => {
    const controller = new AbortController()

    hideDatePickerOnScrollOnWeb(controller)

    return () => {
      controller.abort()
    }
  }, [hideDatePickerOnScrollOnWeb])

  return (
    <DatePickerProvider config={config}>
      <Popover ref={popoverRef} keepChildrenMounted size="$5" allowFlip {...rest}>
        <Adapt when="sm">
          <Popover.Sheet modal dismissOnSnapToBottom snapPointsMode="fit">
            <Popover.Sheet.Frame padding="$8" alignItems="center">
              <Adapt.Contents />
            </Popover.Sheet.Frame>
          </Popover.Sheet>
        </Adapt>
        {children}
      </Popover>
    </DatePickerProvider>
  )
}
