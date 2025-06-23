export default function getBaseUrl() {
  if (typeof window !== 'undefined') {
    // browser should use relative path
    return ''
  }

  if (process.env.URL) {
    // overwrites the rest - set this on your native app deployment
    return `https://${process.env.URL}`
  }

  if (process.env.VERCEL_URL) {
    // reference for vercel.com
    return `https://${process.env.VERCEL_URL}`
  }

  if (process.env.RENDER_INTERNAL_HOSTNAME) {
    // reference for render.com
    return `http://${process.env.RENDER_INTERNAL_HOSTNAME}:${process.env.PORT}`
  }

  // assume localhost
  return `http://localhost:${process.env.PORT ?? 3000}`
}
