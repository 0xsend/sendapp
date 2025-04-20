import { SelectorType } from '../types'
import { DaySelector } from './DaySelector'
import { MonthSelector } from './MonthSelector'
import { MonthSelectorHeader } from './MonthSelectorHeader'
import { MonthSlider } from './MonthSlider'
import { YearRangeSlider } from './YearRangeSlider'
import { YearSelector } from './YearSelector'

export * from './YearRangeSlider'
export * from './MonthSelectorHeader'
export * from './MonthSlider'
export * from './YearSelector'
export * from './MonthSelector'
export * from './DaySelector'
export * from './DatePickerPopover'

export const CalendarBody = ({
  selectorType,
  setSelectorType,
}: {
  selectorType: SelectorType
  setSelectorType: (selectorType: SelectorType) => void
}) => {
  switch (selectorType) {
    case SelectorType.Year:
      return <YearSelector onChange={() => setSelectorType(SelectorType.Day)} />
    case SelectorType.Month:
      return <MonthSelector onChange={() => setSelectorType(SelectorType.Day)} />
    case SelectorType.Day:
      return <DaySelector />
  }
}

export const CalendarHeader = ({
  selectorType,
  setSelectorType,
}: {
  selectorType: SelectorType
  setSelectorType: (selectorType: SelectorType) => void
}) => {
  switch (selectorType) {
    case SelectorType.Year:
      return <YearRangeSlider />
    case SelectorType.Month:
      return <MonthSelectorHeader />
    case SelectorType.Day:
      return <MonthSlider setSelectorType={setSelectorType} />
  }
}
