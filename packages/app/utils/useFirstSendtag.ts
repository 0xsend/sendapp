import { useAsyncStorage } from './useAsyncStorage'

export const useFirstSendtagQuery = () => {
  const { useQueryItem } = useAsyncStorage<string>('first_sendtag')
  return useQueryItem()
}

export const useSetFirstSendtag = () => {
  const { useSetItem } = useAsyncStorage<string>('first_sendtag')
  return useSetItem()
}
