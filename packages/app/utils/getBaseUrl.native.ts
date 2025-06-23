import { replaceLocalhost } from './getLocalhost.native'

function _getBaseUrl() {
  if (process.env.NEXT_PUBLIC_URL) {
    // overwrites the rest - set this on your native app deployment
    return process.env.NEXT_PUBLIC_URL
  }

  // assume localhost
  return `http://localhost:${process.env.PORT ?? 3000}`
}

export default function getBaseUrl() {
  return replaceLocalhost(_getBaseUrl())
}
