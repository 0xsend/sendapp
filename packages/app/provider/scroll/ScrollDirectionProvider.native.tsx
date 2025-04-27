import { createContext, useContext } from 'react'
import type { ScrollDirectionContextValue } from './ScrollDirectionProvider'

const ScrollDirection = createContext<ScrollDirectionContextValue>(
  undefined as unknown as ScrollDirectionContextValue
)

/**
 * FIXME: i don't know what this does exactly on the web yet...
 */
export const ScrollDirectionProvider = ({ children }: { children: React.ReactNode }) => {
  return children
}

/**
 * FIXME: i don't know what this does exactly on the web yet...
 */
export const useScrollDirection = () => {
  const context = useContext(ScrollDirection)
  if (!context) {
    throw new Error('useScrollDirection must be used within a ScrollDirectionProvider')
  }
  return context
}
