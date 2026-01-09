import { useQuery, type UseQueryResult } from '@tanstack/react-query'
import { isSendSquadMember } from 'app/utils/isSendSquadMember'
import { useUser } from 'app/utils/useUser'
import { BRIDGE_ACH_WIRE_BLOCKLIST } from './bridgeGeoBlockList'

export const useBridgeGeoBlock = (): UseQueryResult<boolean> => {
  const geoblockEnabled =
    process.env.NEXT_PUBLIC_GEOBLOCK_BANK_TRANSFER ?? process.env.NEXT_PUBLIC_GEOBLOCK
  const { tags, isLoading: isLoadingUser } = useUser()

  return useQuery<boolean>({
    queryKey: ['bridge-geoblock', tags, geoblockEnabled],
    queryFn: async () => {
      const tagsArray = Array.isArray(tags) ? tags : null
      if (isSendSquadMember(tagsArray)) {
        return false
      }
      if (!geoblockEnabled) {
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

      return BRIDGE_ACH_WIRE_BLOCKLIST.includes(countryCode)
    },
    enabled: !isLoadingUser || !geoblockEnabled,
    staleTime: 300_000,
  })
}
