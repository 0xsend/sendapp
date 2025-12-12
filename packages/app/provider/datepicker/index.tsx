import type React from 'react'
import { DatePickerProvider } from '@rehookify/datepicker'

// Global DatePicker provider with default configuration
// This ensures DatePicker context is available throughout the app,
// including in Tamagui portals on Android
// Default configuration that works for most use cases
const defaultConfig = {
  selectedDates: [],
  onDatesChange: () => {}, // This will be overridden by individual DatePicker instances
  calendar: {
    startDay: 1 as const, // Start week on Monday
  },
}
export function GlobalDatePickerProvider({ children }: { children: React.ReactNode }) {
  return <DatePickerProvider config={defaultConfig}>{children}</DatePickerProvider>
}
