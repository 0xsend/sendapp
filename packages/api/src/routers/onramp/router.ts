import debug from 'debug'
import { createTRPCRouter, protectedProcedure } from '../../trpc'
import { GetSessionTokenRequestSchema } from './types'
import { TRPCError } from '@trpc/server'
import { generateJwt } from '@coinbase/cdp-sdk/auth'

const log = debug('api:routers:onramp')

/**
 * Generates a JWT token for CDP API authentication using the CDP SDK
 * @param keyName - The CDP API key name
 * @param keySecret - The CDP API private key
 * @returns Promise of signed JWT token
 */
async function generateJWT(keyName: string, keySecret: string): Promise<string> {
  const requestMethod = 'POST'
  const requestHost = 'api.developer.coinbase.com'
  const requestPath = '/onramp/v1/token'

  try {
    // Use the CDP SDK to generate the JWT
    return await generateJwt({
      apiKeyId: keyName,
      apiKeySecret: keySecret,
      requestMethod,
      requestHost,
      requestPath,
    })
  } catch (error) {
    log('Error generating JWT:', error)
    throw error
  }
}

export const onrampRouter = createTRPCRouter({
  getSessionToken: protectedProcedure
    .input(GetSessionTokenRequestSchema)
    .mutation(async ({ input: { addresses, assets } }) => {
      log('calling getSessionToken with input: ', {
        addresses,
        assets,
      })

      // Get API credentials from environment variables
      const keyName = process.env.CDP_API_KEY
      const keySecret = process.env.CDP_API_SECRET

      if (!keyName || !keySecret) {
        log('Missing CDP API credentials')
        log('Missing CDP API credentials')
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Missing CDP API credentials',
        })
      }

      let jwtToken: string

      try {
        jwtToken = await generateJWT(keyName, keySecret)
        log('JWT generated successfully')
        log('Missing CDP API credentials')
      } catch (error) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to create JWT token',
        })
      }

      const cdpApiUrl = 'https://api.developer.coinbase.com/onramp/v1/token'

      const requestBody = {
        addresses,
        ...(assets && { assets }),
      }

      log('Making request to CDP API:', {
        url: cdpApiUrl,
        addressCount: addresses.length,
        hasAssets: !!assets,
      })

      let response: Response
      try {
        response = await fetch(cdpApiUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
            Authorization: `Bearer ${jwtToken}`,
          },
          body: JSON.stringify(requestBody),
        })
      } catch (error) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to connect with CDP API',
        })
      }

      const responseText = await response.text()

      if (!response.ok) {
        log('CDP API error:', response.status, response.statusText)
        log('Response body:', responseText)

        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to authenticate with CDP API',
        })
      }

      // Parse successful response
      let data: { token?: string; channelId?: string; channel_id?: string }
      try {
        data = JSON.parse(responseText)
      } catch (error) {
        log('Failed to parse response:', responseText)
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Invalid response from CDP API',
        })
      }

      if (!data.token) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Invalid token returned from CDP API',
        })
      }

      log('Successfully generated session token')

      return {
        token: data.token,
        channel_id: data.channelId || data.channel_id,
      }
    }),
})
