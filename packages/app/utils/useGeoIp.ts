import { useQuery } from '@tanstack/react-query'
import { Platform } from 'react-native'

type GeoIp = {
  /**
   * ISO 3166-1 alpha-2 country code
   */
  country_code: string
}

const fetchGeoIp = async () => {
  const response = await fetch(
    'https://ipapi.co/json/',
    Platform.OS !== 'web'
      ? {
          headers: {
            'User-Agent': 'SendApp/1.0',
          },
        }
      : {}
  )
  if (!response.ok) {
    throw new Error('Failed to fetch geo IP data')
  }
  const data = await response.json()
  return data as GeoIp
}

export const useGeoIp = () => {
  const { data, error, isLoading } = useQuery({
    queryKey: ['geoIp'],
    queryFn: fetchGeoIp,
  })

  return {
    data,
    error,
    isLoading: isLoading || !data,
  }
}
