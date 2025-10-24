import type { Database } from '@my/supabase/database.types'
import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs'
import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'
import { normalizeRedirectUrl } from './utils/normalizeRedirectUrl'

const protectedRoutes = [
  '/activity',
  '/canton-wallet',
  '/deposit',
  '/explore',
  '/rewards',
  '/send',
  '/secret-shop',
  '/sendpot',
  '/leaderboard',
  '/trade',
  '/earn',
  '/account',
]

/**
 * the is protected route might match an ignored route, for example /account/affiliate is an ignored route but /account will match any route starting with /account
 * so we need to explicity put it in the ignored routes array
 * for now routes that have getServerSideProps are ignored to avoid double protection
 */
const ignoredRoutes = ['/account/affiliate', '/earn/']

export async function middleware(req: NextRequest) {
  const res = NextResponse.next()
  const pathname = req.nextUrl.pathname

  const isProtectedRoute = protectedRoutes.some((route) => pathname.startsWith(route))
  const isIgnoredRoute = ignoredRoutes.some((route) => pathname.startsWith(route))

  if (!isProtectedRoute || isIgnoredRoute) {
    return res
  }

  try {
    const supabase = createMiddlewareClient<Database>({ req, res })

    const {
      data: { session },
      error,
    } = await supabase.auth.getSession()

    if (!session || error) {
      const normalizedUrl = normalizeRedirectUrl(req.url)

      const destination =
        normalizedUrl === undefined || normalizedUrl.includes('/auth')
          ? '/'
          : `/?redirectUri=${encodeURIComponent(normalizedUrl)}`

      return NextResponse.redirect(new URL(destination, req.url))
    }

    return res
  } catch (error) {
    console.error('middleware auth error:', error)
    return NextResponse.redirect(new URL('/', req.url))
  }
}

export const config = {
  matcher: '/((?!api|static|.*\\..*|_next).*)',
}
