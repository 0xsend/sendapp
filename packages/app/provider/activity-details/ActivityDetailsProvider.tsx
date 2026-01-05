import { useState, type ReactNode, useMemo } from 'react'
import { ActivityDetailsContext, type ActivityDetailsContextValue } from './ActivityDetailsContext'
import { useRootScreenParams } from 'app/routers/params'
import { useEvent } from '@my/ui'
import type { Activity } from 'app/utils/zod/activity'
import { Platform } from 'react-native'
import { usePush } from 'app/utils/usePush'

interface ActivityDetailsProviderProps {
  children: ReactNode
}

export const ActivityDetailsProvider = ({ children }: ActivityDetailsProviderProps) => {
  const [queryParams, setParams] = useRootScreenParams()
  const [selectedActivity, setSelectedActivity] = useState<Activity | null>(null)
  const push = usePush()

  const selectActivity = useEvent((activity: Activity) => {
    if (Platform.OS !== 'web') {
      push('/activity/details')
    }
    setParams({ ...queryParams, activity: 'details' })
    setSelectedActivity(activity)
  })

  const closeActivityDetails = useEvent(() => {
    setParams({ ...queryParams, activity: undefined }, { webBehavior: 'replace' })
    setSelectedActivity(null)
  })

  const isOpen = Boolean(selectedActivity && queryParams.activity && Platform.OS === 'web')

  const contextValue: ActivityDetailsContextValue = useMemo(
    () => ({
      selectedActivity,
      isOpen,
      selectActivity,
      closeActivityDetails,
    }),
    [selectedActivity, isOpen, selectActivity, closeActivityDetails]
  )

  return (
    <ActivityDetailsContext.Provider value={contextValue}>
      {children}
    </ActivityDetailsContext.Provider>
  )
}
