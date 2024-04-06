import type { GetPlaiceholderImage } from 'app/utils/getPlaiceholderImage'
import { type Dispatch, type SetStateAction, createContext, useContext } from 'react'

export type CarouselImage = { src: string; height: number; width: number; base64?: string }

export interface AuthCarouselContext {
  carouselImages: GetPlaiceholderImage[]
  setCarouselImages: Dispatch<SetStateAction<GetPlaiceholderImage[]>>
  carouselProgress: number
  setCarouselProgress: Dispatch<SetStateAction<number>>
}

const initialState = {
  carouselImages: [],
  setCarouselImages: () => {},
  carouselProgress: 0,
  setCarouselProgress: () => {},
}

export const AuthCarouselContext = createContext<AuthCarouselContext>(initialState)

export function useAuthCarouselContext() {
  const context = useContext(AuthCarouselContext)
  if (!context) {
    throw new Error('useAuthCarouselContext must be used within a AuthCarouselContextProvider')
  }
  return context
}
