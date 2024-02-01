import { copycat } from '@snaplet/copycat'

export function strToTagName(str: string): string {
  return str.replace(/[^a-zA-Z0-9]/gi, '_')
}

// replace all non-alphanumeric characters with a dash
export function tagName(name: string) {
  const newTag = strToTagName(name)
  if (newTag.length > 20) {
    return newTag.substring(0, 20)
  }
  return newTag
}

export function pravatar(username: string) {
  return `https://i.pravatar.cc/500?u=${username}`
}
