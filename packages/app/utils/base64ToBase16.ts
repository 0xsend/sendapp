import { base16, base64urlnopad } from '@scure/base'

export function base64URLNoPadToBase16(base64String: string): string {
  return base16.encode(base64urlnopad.decode(base64String))
}
