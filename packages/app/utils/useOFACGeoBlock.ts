import { useQuery, type UseQueryResult } from '@tanstack/react-query'
import { isSendSquadMember } from './isSendSquadMember'
import { useUser } from './useUser'

// Ported from Megapot UI
const OFACblocklist = [
  'AT',
  'AU',
  'BY',
  'CU',
  'DE',
  'ES',
  'FR',
  'GB',
  'IR',
  'KM',
  'KP',
  'MM',
  'NL',
  'RU',
  'SY',
  'UA',
  'VE',
] // OFAC (Belarus, Cuba, Iran, North Korea, Russia, Syria, Ukraine, Venezuela) + FATF (Iran, North Korea, Myanmar) + Australia, Austria, Comoros, France, Germany, Netherlands, Spain, United Kingdom
// USA is tracked separately
export const useOFACGeoBlock = (): UseQueryResult<boolean> => {
  const { tags, isLoading: isLoadingUser } = useUser()

  return useQuery<boolean>({
    queryKey: ['ofacGeoBlock', tags],
    queryFn: async () => {
      // 1) Bypass check for internal team for testing
      if (isSendSquadMember(tags)) {
        return false
      }
      const ipifyResponse = await fetch('https://api.ipify.org?format=json')
      const ipifyJson = await ipifyResponse.json()
      const ipAddress = ipifyJson.ip
      if (typeof ipAddress !== 'string') {
        return false
      }

      const ipLocationResponse = await fetch(`https://api.iplocation.net/?ip=${ipAddress}`)
      const ipLocationJson = await ipLocationResponse.json()
      const countryCode = ipLocationJson.country_code2
      if (typeof countryCode !== 'string') {
        return false
      }

      return countryCode === 'US' || OFACblocklist.includes(countryCode)
    },
    enabled: !isLoadingUser,
  })
}
