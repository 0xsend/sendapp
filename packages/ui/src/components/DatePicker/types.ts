import type { PopoverProps } from 'tamagui'
import type { ReactNode } from 'react'

export type DatePickerPopoverProps = PopoverProps & {
  value: Date[]
  onChange: (value: Date[]) => void
}

export enum SelectorType {
  Day = 'Day',
  Month = 'Month',
  Year = 'Year',
}

export type DatePickerProps = {
  value: Date[]
  onChange: (value: Date[]) => void
  children: ReactNode
}
