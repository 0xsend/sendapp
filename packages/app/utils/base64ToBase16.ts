import { base16, base64 } from '@scure/base'

export function base64ToBase16(base64String: string): string {
  return base16.encode(base64.decode(base64String))
}
