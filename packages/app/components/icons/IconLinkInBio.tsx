import type { IconProps } from '@tamagui/helpers-icon'
import type { NamedExoticComponent } from 'react'
import { IconGithub } from './IconGithub'
import { IconInstagram } from './IconInstagram'
import { IconTikTok } from './IconTikTok'
import { IconXLogo } from './IconXLogo'
import { IconTelegramLogo } from './IconTelegramLogo'
import { IconYoutube } from './IconYoutube'
import { IconDiscord } from './IconDiscord'
import { type ColorTokens, XStack } from '@my/ui'
import { IconWorldSearch } from './IconWorldSearch'
import type { LinkInBioDomainNamesEnum } from 'app/utils/useLinkInBioMutation'

export const domainColors: Partial<Record<LinkInBioDomainNamesEnum, ColorTokens>> = {
  X: 'black',
  Telegram: '$telegramBlue',
  Discord: '$discordPurple',
  YouTube: '$youtubeRed',
  Instagram: '$instagramPink',
  TikTok: '$white',
  GitHub: 'black',
} as const

const domainIcons: Partial<Record<LinkInBioDomainNamesEnum, NamedExoticComponent<IconProps>>> = {
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
    return (
      <XStack
        justifyContent="center"
        alignItems="center"
        padding="$2"
        aspectRatio={1}
        w={40}
        h={40}
        bc={'$color11'}
        br={12}
      >
        <IconWorldSearch size="$100%" color="$color1" {...props} />
      </XStack>
    )
  }

  return (
    <XStack
      justifyContent="center"
      alignItems="center"
      padding="$2"
      aspectRatio={1}
      w={40}
      h={40}
      bc={domainColors[domain_name]}
      br={12}
    >
      <Icon size="$100%" color="white" {...props} />
    </XStack>
  )
}
