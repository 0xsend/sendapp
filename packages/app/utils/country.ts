import { countries as countriesJSON } from 'app/data/countries'

export type Country = {
  name: string
  code: string
  flag: string
  dialCode: string
}

export const countries = countriesJSON.map((country) => ({
  name: country.name,
  code: country.code,
  dialCode: country.dial_code,
  flag: country.flag,
}))
