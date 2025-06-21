import type { IconProps } from '@tamagui/helpers-icon'
import type { NamedExoticComponent } from 'react'
import { IconGithub } from './IconGithub'
import { IconInstagram } from './IconInstagram'
import { IconTikTok } from './IconTikTok'
import { IconXLogo } from './IconXLogo'
import { IconTelegramLogo } from './IconTelegramLogo'
import { IconYoutube } from './IconYoutube'
import { IconDiscord } from './IconDiscord'
import type { Database } from '@my/supabase/database-generated.types'
import { XStack } from '@my/ui'

export const domainColors = {
  X: 'black',
  Telegram: '$telegramBlue',
  Discord: '$discordPurple',
  YouTube: '$youtubeRed',
  Instagram: '$instagramPink',
  TikTok: '$white',
  GitHub: 'black',
} as const

const domainIcons: Record<
  Database['public']['Enums']['link_in_bio_domain_names'],
  NamedExoticComponent<IconProps>
> = {
  X: IconXLogo,
  Telegram: IconTelegramLogo,
  YouTube: IconYoutube,
  Discord: IconDiscord,
  TikTok: IconTikTok,
  Instagram: IconInstagram,
  GitHub: IconGithub,
} as const

export const IconLinkInBio = ({ domain_name, ...props }: { domain_name: string } & IconProps) => {
  const Icon = domainIcons[domain_name]

  if (!Icon) {
    console.warn(`No icon found for ${domain_name}`)
    return null
  }

  return (
    <XStack
      justifyContent="center"
      alignItems="center"
      padding="$2"
      aspectRatio={1}
      maw={40}
      mah={40}
      bc={domainColors[domain_name]}
      br={12}
    >
      <Icon size={'$4'} {...props} />
    </XStack>
  )
}
