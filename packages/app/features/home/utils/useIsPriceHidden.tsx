import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import AsyncStorage from '@react-native-async-storage/async-storage'

type IsPriceHiddenContextType = {
  isPriceHidden: boolean
  toggleIsPriceHidden: () => void
}

const IsPriceHiddenContext = createContext<IsPriceHiddenContextType | undefined>(undefined)

export const IsPriceHiddenProvider = ({ children }: { children: ReactNode }) => {
  const [isPriceHidden, setIsPriceHidden] = useState<boolean>(true)

  useEffect(() => {
    const getIsPriceHidden = async () => {
      try {
        const savedIsPriceHidden = await AsyncStorage.getItem('isPriceHidden')
        setIsPriceHidden(savedIsPriceHidden ? JSON.parse(savedIsPriceHidden) : false)
      } catch (error) {
        console.error('Error reading isPriceHidden from AsyncStorage:', error)
      }
    }

    void getIsPriceHidden()
  }, [])

  const toggleIsPriceHidden = async () => {
    try {
      const newValue = !isPriceHidden
      await AsyncStorage.setItem('isPriceHidden', JSON.stringify(newValue))
      setIsPriceHidden(newValue)
    } catch (error) {
      console.error('Error saving isPriceHidden to AsyncStorage:', error)
    }
  }

  return (
    <IsPriceHiddenContext.Provider value={{ isPriceHidden, toggleIsPriceHidden }}>
      {children}
    </IsPriceHiddenContext.Provider>
  )
}

export const useIsPriceHidden = () => {
  const context = useContext(IsPriceHiddenContext)
  if (context === undefined) {
    throw new Error('useIsPriceHidden must be used within a IsPriceHiddenProvider')
  }
  return context
}
