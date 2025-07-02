import { useAsyncStorage } from 'app/utils/useAsyncStorage'

export const useReferralCodeQuery = () => {
  const { useQueryItem } = useAsyncStorage<string>('referral_code')
  return useQueryItem()
}

export const useSetReferralCode = () => {
  const { useSetItem } = useAsyncStorage<string>('referral_code')
  return useSetItem()
}
