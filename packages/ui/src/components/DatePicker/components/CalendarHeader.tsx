import { SelectorType } from '../types'
import { MonthSlider, MonthSelectorHeader, YearRangeSlider } from '.'

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
