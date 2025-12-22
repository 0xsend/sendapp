import { ImageResponse } from '@vercel/og'
import type { NextRequest } from 'next/server'
import type React from 'react'
import { z } from 'zod'
import { formatAmountForDisplay } from 'utils/seoHelpers'
import { loadGoogleFont, safeDecode } from '../../../utils/og'

export const config = {
  runtime: 'edge',
}

const OGParamsSchema = z.object({
  amount: z.string().trim().max(50).optional(),
  symbol: z.string().trim().max(20).optional(),
  additional_count: z.string().trim().optional(),
})

interface CheckData {
  amount?: string
  symbol?: string
  additionalCount?: number
}

// Send brand colors
const SEND_PRIMARY = '#40FB50'
const SEND_CHARCOAL = '#081619'

const checkReactElement = (check: CheckData): React.ReactElement => {
  const hasAdditional = check.additionalCount && check.additionalCount > 0

  return (
    <div
      style={{
        height: '100%',
        width: '100%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: 'DM Sans, system-ui, sans-serif',
        backgroundColor: SEND_PRIMARY,
      }}
    >
      {/* Content */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '24px',
        }}
      >
        {/* Check label */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '12px 28px',
            borderRadius: '12px',
            backgroundColor: 'rgba(0, 0, 0, 0.1)',
          }}
        >
          <p
            style={{
              fontSize: '32px',
              color: SEND_CHARCOAL,
              fontWeight: 600,
              margin: 0,
              letterSpacing: '0.05em',
            }}
          >
            SEND CHECK
          </p>
        </div>

        {/* Amount display */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          <p
            style={{
              fontSize: '36px',
              color: 'rgba(8, 22, 25, 0.7)',
              fontWeight: 400,
              margin: 0,
            }}
          >
            For
          </p>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '20px',
            }}
          >
            <p
              style={{
                fontSize: '96px',
                color: SEND_CHARCOAL,
                fontWeight: 700,
                margin: 0,
                lineHeight: 1,
              }}
            >
              {check.amount || '?'}
            </p>
            <p
              style={{
                fontSize: '96px',
                color: SEND_CHARCOAL,
                fontWeight: 700,
                margin: 0,
                lineHeight: 1,
              }}
            >
              {check.symbol || 'TOKENS'}
            </p>
          </div>
          {hasAdditional && check.additionalCount && (
            <p
              style={{
                fontSize: '28px',
                color: 'rgba(8, 22, 25, 0.6)',
                fontWeight: 400,
                margin: 0,
              }}
            >
              +{check.additionalCount} more token{check.additionalCount > 1 ? 's' : ''}
            </p>
          )}
        </div>
      </div>

      {/* /send branding */}
      <div
        style={{
          position: 'absolute',
          bottom: '40px',
          right: '40px',
          display: 'flex',
          alignItems: 'center',
          fontSize: '48px',
          color: SEND_CHARCOAL,
          fontFamily: 'DM Sans, system-ui, sans-serif',
          fontWeight: 700,
        }}
      >
        /send
      </div>
    </div>
  )
}

/**
 * OpenGraph image generation API route for Send Checks
 * Generates social media preview images showing check amount and token
 *
 * Query parameters:
 * - amount: formatted token amount (e.g., "100.00")
 * - symbol: token symbol (e.g., "USDC")
 * - additional_count: number of additional tokens in the check (optional)
 *
 * Examples:
 * - /api/og/check?amount=100&symbol=USDC
 * - /api/og/check?amount=50&symbol=SEND&additional_count=1
 */
export default async function handler(req: NextRequest) {
  try {
    const { searchParams } = req.nextUrl

    const decoded = {
      amount: safeDecode(searchParams.get('amount') || undefined),
      symbol: safeDecode(searchParams.get('symbol') || undefined),
      additional_count: safeDecode(searchParams.get('additional_count') || undefined),
    }

    const parsed = OGParamsSchema.safeParse(decoded)

    const safeAmount = parsed.success && parsed.data.amount ? parsed.data.amount : undefined
    const safeSymbol = parsed.success && parsed.data.symbol ? parsed.data.symbol : undefined
    const safeAdditionalCount =
      parsed.success && parsed.data.additional_count
        ? Number.parseInt(parsed.data.additional_count, 10)
        : undefined

    const check: CheckData = {
      amount: safeAmount ? formatAmountForDisplay(safeAmount) : undefined,
      symbol: safeSymbol,
      additionalCount:
        safeAdditionalCount && !Number.isNaN(safeAdditionalCount) ? safeAdditionalCount : undefined,
    }

    // Collect all text for font optimization
    const text = [
      'SEND CHECK',
      'For',
      check.amount || '?',
      check.symbol || 'TOKENS',
      '/send',
      '+more tokens',
    ].join('')

    const [font400, font600, font700] = await Promise.all([
      loadGoogleFont('DM Sans', 400, text),
      loadGoogleFont('DM Sans', 600, text),
      loadGoogleFont('DM Sans', 700, text),
    ])
    if (!font400 || !font600 || !font700) {
      throw new Error('Failed to load fonts')
    }

    const response = new ImageResponse(checkReactElement(check), {
      width: 1200,
      height: 630,
      fonts: [
        {
          name: 'DM Sans',
          data: font400,
          style: 'normal',
          weight: 400,
        },
        {
          name: 'DM Sans',
          data: font600,
          style: 'normal',
          weight: 600,
        },
        {
          name: 'DM Sans',
          data: font700,
          style: 'normal',
          weight: 700,
        },
      ],
    })

    response.headers.set('Content-Type', 'image/png')
    response.headers.set('Cache-Control', 'public, s-maxage=86400, stale-while-revalidate=43200')
    response.headers.set('Access-Control-Allow-Origin', '*')
    response.headers.set('Access-Control-Allow-Methods', 'GET')
    return response
  } catch (e) {
    console.error('Error generating OG check image:', e)
    return new Response('Failed to generate image', { status: 500 })
  }
}
