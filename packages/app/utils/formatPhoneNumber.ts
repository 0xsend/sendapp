import { parsePhoneNumber } from 'libphonenumber-js'

export const formatPhoneNumber = (phoneNumber: string | undefined): string => {
  if (!phoneNumber) {
    return ''
  }
  let number = phoneNumber.trim().replace(/\D/g, '')
  if (!number.startsWith('+') && number.length >= 11) {
    number = `+${number}`
  }

  try {
    const nparse = parsePhoneNumber(number)
    if (nparse) {
      // is US number, format it as US number
      if (number.startsWith('+1') && number.length === 12) {
        return nparse.formatNational()
      }
      return nparse.formatInternational()
    }
  } catch (e) {
    // dont really want to throw an error here as then the app will not display anything,
    // so just return the original number
    return number
  }
  return number
}

export function normalizePhoneNumber(phoneInput: string): string {
  try {
    // Try US format first
    let parsed = parsePhoneNumber(phoneInput, 'US')
    if (!parsed.isValid()) {
      // Try international format
      parsed = parsePhoneNumber(phoneInput.startsWith('+') ? phoneInput : `+${phoneInput}`)
      if (!parsed.isValid()) {
        throw new Error('Invalid phone number')
      }
    }
    return parsed.format('E.164')
  } catch (error) {
    throw new Error('Please enter a valid phone number')
  }
}
