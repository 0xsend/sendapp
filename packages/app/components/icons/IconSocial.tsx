import type { IconProps } from '@tamagui/helpers-icon'
import type { NamedExoticComponent } from 'react'
import { IconGithub } from './IconGithub'
import { IconInstagram } from './IconInstagram'
import { IconTikTok } from './IconTikTok'
import { IconXLogo } from './IconXLogo'
import { IconTelegramLogo } from './IconTelegramLogo'
import { IconYoutube } from './IconYoutube'
import { IconDiscord } from './IconDiscord'

const socialToIcons: Record<string, NamedExoticComponent<IconProps>> = {
  X: IconXLogo,
  Telegram: IconTelegramLogo,
  YouTube: IconYoutube,
  Discord: IconDiscord,
  TikTok: IconTikTok,
  Instagram: IconInstagram,
  GitHub: IconGithub,
}

export const IconSocial = ({ domain_name, ...props }: { domain_name: string } & IconProps) => {
  const Icon = socialToIcons[domain_name]

  if (!Icon) {
    console.warn(`No icon found for ${domain_name}`)
    return null
  }

  return <Icon size={'$2.5'} {...props} />
}
