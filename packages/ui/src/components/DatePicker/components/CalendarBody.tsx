import { SelectorType } from '../types'
import { YearSelector, MonthSelector, DaySelector } from '.'

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
