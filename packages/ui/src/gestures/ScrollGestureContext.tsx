import type React from 'react'
import { createContext, useContext } from 'react'
import type { Gesture } from 'react-native-gesture-handler'

export type NativeGestureType = ReturnType<typeof Gesture.Native>

const ScrollGestureContext = createContext<NativeGestureType | null>(null)

export function ScrollGestureProvider({
  value,
  children,
}: {
  value: NativeGestureType
  children: React.ReactNode
}) {
  return <ScrollGestureContext.Provider value={value}>{children}</ScrollGestureContext.Provider>
}

export function useScrollNativeGesture(): NativeGestureType | null {
  return useContext(ScrollGestureContext)
}
