import { useState, useCallback, type ReactNode } from 'react'
import { ActivityDetailsContext, type ActivityDetailsContextValue } from './ActivityDetailsContext'
import { useRootScreenParams } from 'app/routers/params'
import type { Activity } from 'app/utils/zod/activity'

interface ActivityDetailsProviderProps {
  children: ReactNode
}

export const ActivityDetailsProvider = ({ children }: ActivityDetailsProviderProps) => {
  const [queryParams, setParams] = useRootScreenParams()
  const [selectedActivity, setSelectedActivity] = useState<Activity | null>(null)

  const selectActivity = useCallback(
    (activity: Activity) => {
      setParams({ ...queryParams, activity: 'details' })
      setSelectedActivity(activity)
    },
    [queryParams, setParams]
  )

  const closeActivityDetails = useCallback(() => {
    setParams({ ...queryParams, activity: undefined }, { webBehavior: 'replace' })
    setSelectedActivity(null)
  }, [queryParams, setParams])

  const isOpen = Boolean(selectedActivity && queryParams.activity)

  const contextValue: ActivityDetailsContextValue = {
    selectedActivity,
    isOpen,
    selectActivity,
    closeActivityDetails,
  }

  return (
    <ActivityDetailsContext.Provider value={contextValue}>
      {children}
    </ActivityDetailsContext.Provider>
  )
}
