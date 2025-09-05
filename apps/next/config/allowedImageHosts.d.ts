export const allowedImageHosts: readonly [
  'ugqtoulexhvahevsysuq.supabase.co',
  'fjswgwdweohwejbrmiil.supabase.co',
  'ui-avatars.com',
  'avatars.githubusercontent.com',
  'cloudflare-ipfs.com',
  'ghassets.send.app',
  'localhost',
  'github.com',
]

export type AllowedImageHost = (typeof allowedImageHosts)[number]
export type VercelWildcardHost = `${string}-0xsend.vercel.app`
