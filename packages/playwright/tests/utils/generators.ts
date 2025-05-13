import { countries } from 'app/utils/country'

export const generatePhone = () => `${Math.floor(Math.random() * 1e9)}`
export const generateSendtag = () => `test_${Math.floor(Math.random() * 1000000)}`
export const generateCountry = () =>
  countries[Math.floor(Math.random() * countries.length)] as (typeof countries)[number]
