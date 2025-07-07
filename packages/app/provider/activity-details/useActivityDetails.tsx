import { useContext } from 'react'
import { ActivityDetailsContext, type ActivityDetailsContextValue } from './ActivityDetailsContext'

export const useActivityDetails = (): ActivityDetailsContextValue => {
  const context = useContext(ActivityDetailsContext)

  if (!context) {
    throw new Error('useActivityDetails must be used within an ActivityDetailsProvider')
  }

  return context
}
