import { useQuery } from '@tanstack/react-query'

const fetchGeoIp = async () => {
  const response = await fetch('https://ipapi.co/json/')
  if (!response.ok) {
    throw new Error('Failed to fetch geo IP data')
  }
  const data = await response.json()
  return data
}

export const useGeoIp = () => {
  const { data, error, isLoading } = useQuery(['geoIp'], fetchGeoIp)

  return {
    data,
    error,
    isLoading: isLoading || !data,
  }
}
