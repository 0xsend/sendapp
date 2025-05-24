import { createPagesServerClient } from '@supabase/auth-helpers-nextjs'
import type { NextApiHandler } from 'next'
import { validateRedirectUrl } from 'next-app/utils/validateRedirectUrl'

const handler: NextApiHandler = async (req, res) => {
  const { code, redirectUri } = req.query

  if (code) {
    const supabase = createPagesServerClient({ req, res })
    await supabase.auth.exchangeCodeForSession(String(code))
  }

  const destination = validateRedirectUrl(redirectUri as string)
  res.redirect(destination)
}

export default handler
