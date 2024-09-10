import { useQuery } from '@tanstack/react-query'

type GeoIp = {
  /**
   * ISO 3166-1 alpha-2 country code
   */
  country_code: string
}

const fetchGeoIp = async () => {
  const response = await fetch('https://ipapi.co/json/')
  if (!response.ok) {
    const response2 = await fetch('https://api.ip2location.io/')
    if (!response2.ok) {
      throw new Error('Failed to fetch geo IP data')
    }
    const data2 = await response2.json()
    return data2 as GeoIp
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
