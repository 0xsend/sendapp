import { createContext } from 'react'
import type { Activity } from 'app/utils/zod/activity'

export interface ActivityDetailsContextValue {
  selectedActivity: Activity | null
  isOpen: boolean
  selectActivity: (activity: Activity) => void
  closeActivityDetails: () => void
}

export const ActivityDetailsContext = createContext<ActivityDetailsContextValue | null>(null)
