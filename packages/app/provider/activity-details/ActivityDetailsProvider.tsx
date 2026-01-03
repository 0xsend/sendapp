import { useState, useCallback, type ReactNode } from 'react'
import { ActivityDetailsContext, type ActivityDetailsContextValue } from './ActivityDetailsContext'
import { useRootScreenParams } from 'app/routers/params'
import { useEvent } from '@my/ui'
import type { Activity } from 'app/utils/zod/activity'
import { Platform } from 'react-native'
import { usePush } from 'app/utils/usePush'
import { useAnalytics } from 'app/provider/analytics'

interface ActivityDetailsProviderProps {
  children: ReactNode
}

export const ActivityDetailsProvider = ({ children }: ActivityDetailsProviderProps) => {
  const [queryParams, setParams] = useRootScreenParams()
  const [selectedActivity, setSelectedActivity] = useState<Activity | null>(null)
  const push = usePush()
  const analytics = useAnalytics()

  const selectActivity = useEvent((activity: Activity) => {
    // Track activity item opened
    analytics.capture({
      name: 'activity_item_opened',
      properties: {
        item_type: activity.event_name,
      },
    })

    if (Platform.OS !== 'web') {
      push('/activity/details')
    }
    setParams({ ...queryParams, activity: 'details' })
    setSelectedActivity(activity)
  })

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
