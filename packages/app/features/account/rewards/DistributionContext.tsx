import { useRewardsScreenParams } from 'app/routers/params'
import { createContext, useCallback, useContext, useState } from 'react'

type DistributionContextType = {
  distribution: number | undefined
  setDistribution: (distribution: number | undefined) => void
}

const DistributionContext = createContext<DistributionContextType | undefined>(undefined)

export const DistributionProvider = ({ children }: { children: React.ReactNode }) => {
  const [{ distribution }] = useRewardsScreenParams()
  const [selectedDistribution, setSelected] = useState(distribution)

  // Sync URL with context when needed
  const setSelectedDistribution = useCallback((value: number | undefined) => {
    setSelected(value)
    // Optionally debounce URL updates
    //Setting the url causes massive rerenders for some reason
    // setParams({ distribution: value })
  }, [])

  return (
    <DistributionContext.Provider
      value={{ distribution: selectedDistribution, setDistribution: setSelectedDistribution }}
    >
      {children}
    </DistributionContext.Provider>
  )
}

// Custom hook
export const useDistributionContext = () => {
  const context = useContext(DistributionContext)
  if (!context) throw new Error('useDistributionContext must be used within DistributionProvider')
  return context
}
