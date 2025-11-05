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

  it('flags Cloudflare-blocked responses and returns mitigation guidance with Ray ID', () => {
    const response = {
      status: 403,
      url: 'https://api.send.app/signup',
      headers: new Headers({
        server: 'cloudflare',
        'cf-ray': '12345abcd-SLC',
      }),
    }

    const error = {
      message: 'ERR_NETWORK',
      meta: { response },
    }

    const result = formatErrorMessage(error)

    expect(result).toBe(
      'Cloudflare blocked this request. Try disabling your VPN then reload with Ctrl+R, or use an incognito window for signup. Ray ID: 12345abcd-SLC'
    )
  })

  it('shows specific Cloudflare error message for rate limiting (1015)', () => {
    const response = {
      status: 403,
      url: 'https://api.send.app/signup',
      headers: new Headers({
        server: 'cloudflare',
        'cf-ray': '12345abcd-SLC',
      }),
    }

    const error = {
      message: 'Forbidden',
      meta: {
        response,
        responseJSON: '<html><body><p>Error code: 1015</p></body></html>',
      },
    }

    const result = formatErrorMessage(error)

    expect(result).toBe(
      'Cloudflare blocked this request: Rate limited: Too many requests. Ray ID: 12345abcd-SLC'
    )
  })

  it('shows specific Cloudflare error message for IP banned using cf-error-code class', () => {
    const response = {
      status: 403,
      url: 'https://api.send.app/signup',
      headers: new Headers({
        server: 'cloudflare',
        'cf-ray': 'abc123-DFW',
      }),
    }

    const error = {
      message: 'Forbidden',
      meta: {
        response,
        responseJSON: '<html><body><span class="cf-error-code">1006</span></body></html>',
      },
    }

    const result = formatErrorMessage(error)

    expect(result).toBe(
      'Cloudflare blocked this request: Your IP address has been banned. Ray ID: abc123-DFW'
    )
  })

  it('does not show Cloudflare error for origin 403 without Cloudflare indicators', () => {
    const response = {
      status: 403,
      url: 'https://api.send.app/admin',
      headers: new Headers({
        server: 'nginx',
      }),
    }

    const error = {
      message: 'Forbidden',
      meta: {
        response,
        responseJSON: '{"error": "Access denied by application"}',
      },
    }

    const result = formatErrorMessage(error)

    expect(result).toBe(
      'Send servers are blocking this request. Try Ctrl+R and/or disabling VPN. Error: Forbidden'
    )
  })

  it('should not show Cloudflare blocking message for 500 errors', () => {
    const response = {
      status: 500,
      url: 'https://api.send.app/signup',
      headers: new Headers({
        server: 'cloudflare',
        'cf-ray': '12345abcd',
      }),
    }

    const error = {
      message: 'Internal Server Error',
      meta: { response },
    }

    const result = formatErrorMessage(error)

    expect(result).toBe('Internal Server Error')
  })

  it('should not show blocking message for 404 errors', () => {
    const response = {
      status: 404,
      url: 'https://api.send.app/user/123',
    }

    const error = {
      message: 'Not Found',
      meta: { response },
    }

    const result = formatErrorMessage(error)

    expect(result).toBe('Not Found')
  })
})
