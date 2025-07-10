import { useState, useCallback, type ReactNode } from 'react'
import { ActivityDetailsContext, type ActivityDetailsContextValue } from './ActivityDetailsContext'
import { useRootScreenParams } from 'app/routers/params'
import type { Activity } from 'app/utils/zod/activity'
import { Platform } from 'react-native'
import { useRouter } from 'solito/router'

interface ActivityDetailsProviderProps {
  children: ReactNode
}

export const ActivityDetailsProvider = ({ children }: ActivityDetailsProviderProps) => {
  const [queryParams, setParams] = useRootScreenParams()
  const [selectedActivity, setSelectedActivity] = useState<Activity | null>(null)
  const router = useRouter()

  const selectActivity = useCallback(
    (activity: Activity) => {
      if (Platform.OS !== 'web') {
        router.push('/activity/details')
      }
      setParams({ ...queryParams, activity: 'details' })
      setSelectedActivity(activity)
    },
    [queryParams, setParams, router.push]
  )

  const closeActivityDetails = useCallback(() => {
    setParams({ ...queryParams, activity: undefined }, { webBehavior: 'replace' })
    setSelectedActivity(null)
  }, [queryParams, setParams])

  const isOpen = Boolean(selectedActivity && queryParams.activity && Platform.OS === 'web')

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
