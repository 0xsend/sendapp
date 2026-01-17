import { isWeb } from '@tamagui/core'
import React from 'react'

const ReactActivity = isWeb
  ? (
      React as unknown as {
        Activity?: React.FC<{ mode: 'visible' | 'hidden'; children: React.ReactNode }>
      }
    ).Activity
  : undefined
// TODO: Remove fallback once upgraded to React Native 0.83+ (adds Activity support)
export const Activity: React.FC<{ mode: 'visible' | 'hidden'; children: React.ReactNode }> =
  ReactActivity ?? (({ mode, children }) => (mode === 'hidden' ? null : <>{children}</>))
