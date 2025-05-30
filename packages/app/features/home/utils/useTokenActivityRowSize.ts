import { useMedia } from '@my/ui'

export const useTokenActivityRowSize = () => {
  const media = useMedia()

  return {
    height: media.gtLg ? 118 : 102,
  }
}
