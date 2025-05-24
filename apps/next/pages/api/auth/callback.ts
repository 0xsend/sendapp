import { createPagesServerClient } from '@supabase/auth-helpers-nextjs'
import type { NextApiHandler } from 'next'

const handler: NextApiHandler = async (req, res) => {
  const { code, redirectUri } = req.query

  if (code) {
    const supabase = createPagesServerClient({ req, res })
    await supabase.auth.exchangeCodeForSession(String(code))
  }

  // Handle redirectUri with safety validation
  let destination = '/'
  if (redirectUri && typeof redirectUri === 'string') {
    const decodedUri = decodeURIComponent(redirectUri)
    
    // Validate that the redirect URI is safe
    if (decodedUri.startsWith('/') && !decodedUri.startsWith('//')) {
      // Relative path - safe to use
      destination = decodedUri
    } else if (decodedUri.startsWith('http')) {
      // Full URL - validate same origin
      try {
        const redirectUrl = new URL(decodedUri)
        const currentHost = req.headers.host
        
        // Check if the redirect URL is to the same origin
        if (currentHost && redirectUrl.host === currentHost) {
          destination = redirectUrl.pathname + redirectUrl.search + redirectUrl.hash
        }
      } catch {
        // Invalid URL format - use default destination
      }
    }
  }

  res.redirect(destination)
}

export default handler
