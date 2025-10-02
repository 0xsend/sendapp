import { describe, it, expect } from '@jest/globals'
import { formatErrorMessage } from './formatErrorMessage'

describe('formatErrorMessage', () => {
  it('should return "Passkey Authentication Failed"', () => {
    const error = new Error(
      'The operation either timed out or was not allowed due to security reasons'
    )
    const result = formatErrorMessage(error)
    expect(result).toBe('Passkey Authentication Failed')
  })

  it('should return the original error message', () => {
    const error = new Error('Some other error message')
    const result = formatErrorMessage(error)
    expect(result).toBe('Some other error message')
  })

  it('flags Cloudflare-blocked responses and returns mitigation guidance', () => {
    const response = {
      status: 403,
      url: 'https://api.send.app/signup',
      headers: new Headers({
        server: 'cloudflare',
        'cf-ray': '12345abcd',
      }),
    }

    const error = {
      message: 'ERR_NETWORK',
      meta: { response },
    }

    const result = formatErrorMessage(error)

    expect(result).toBe(
      'Cloudflare is blocking this request — try disabling your VPN then reload with Ctrl+R, or use an incognito window for signup.'
    )
  })
})
