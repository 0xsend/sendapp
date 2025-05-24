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
    // Validate that the redirect URI is safe (relative path or same origin)
    if (decodedUri.startsWith('/') && !decodedUri.startsWith('//')) {
      destination = decodedUri
    }
  }

  res.redirect(destination)
}

export default handler
