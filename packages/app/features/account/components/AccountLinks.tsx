import { AccountNavLink } from './AccountNavLink'
import { useSupabase } from 'app/utils/supabase/useSupabase'
import { Button, type ColorTokens, Paragraph, type SizeTokens, YGroup, YStack } from '@my/ui'
import { baseMainnet } from '@my/wagmi/chains'
import {
  IconAccount,
  IconDollar,
  IconFingerprint,
  IconGroup,
  IconIdCard,
  IconInfoCircle,
  IconLogout,
  IconQuestionCircle,
  IconSlash,
  IconStarOutline,
  IconTrash,
  IconWorldSearch,
  IconXLogo,
} from 'app/components/icons'
import { Lock } from '@tamagui/lucide-icons'
import { RowLabel } from 'app/components/layout/RowLabel'
import useIntercom from 'app/utils/intercom/useIntercom'
import { memo, useCallback, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Platform } from 'react-native'
import * as Application from 'expo-application'
import { AccountDeletionFlow } from './AccountDeletionFlow'

const iconProps = {
  size: '$1.5' as SizeTokens,
  color: '$primary' as ColorTokens,
  '$theme-light': {
    color: '$color12' as ColorTokens,
  },
}

const shadowProps = {
  shadowColor: '#000',
  shadowOffset: {
    width: 0,
    height: 3,
  },
  shadowOpacity: 0.05,
  shadowRadius: 8,

  elevationAndroid: 7,
} as const

export const AccountLinks = memo(function AccountLinks(): JSX.Element {
  const supabase = useSupabase()
  const { openChat } = useIntercom()
  const { t } = useTranslation('account')
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)

  const handleSignOut = useCallback(() => {
    void supabase.auth.signOut()
  }, [supabase.auth])

  const showSecretShop = __DEV__ || baseMainnet.id === 84532

  const icons = useMemo(
    () => ({
      account: <IconAccount {...iconProps} />,
      idCard: <IconIdCard {...iconProps} />,
      xLogo: <IconXLogo {...iconProps} />,
      fingerprint: <IconFingerprint {...iconProps} />,
      slash: <IconSlash {...iconProps} />,
      group: <IconGroup {...iconProps} />,
      starOutline: <IconStarOutline {...iconProps} />,
      worldSearch: <IconWorldSearch {...iconProps} />,
      dollar: <IconDollar {...iconProps} scale={1.2} />,
      trash: <IconTrash {...iconProps} />,
      infoCircle: <IconInfoCircle {...iconProps} />,
      questionCircle: <IconQuestionCircle {...iconProps} />,
      lock: <Lock {...iconProps} />,
    }),
    []
  )

  return (
    <YStack gap={'$5'} pb={'$3.5'}>
      <YStack gap={'$3.5'}>
        <RowLabel>{t('links.sections.profile')}</RowLabel>
        <YGroup bc="$color1" p="$2" $gtLg={{ p: '$3.5' }} {...shadowProps}>
          <YGroup.Item>
            <AccountNavLink
              text={t('links.items.profile')}
              href="/account/edit-profile"
              icon={icons.account}
            />
          </YGroup.Item>
          <YGroup.Item>
            <AccountNavLink
              text={t('links.items.personalInfo')}
              href="/account/personal-info"
              icon={icons.idCard}
            />
          </YGroup.Item>
          <YGroup.Item>
            <AccountNavLink
              text={t('links.items.language')}
              href="/account/language"
              icon={icons.worldSearch}
            />
          </YGroup.Item>
          <YGroup.Item>
            <AccountNavLink
              text={t('links.items.linkInBio')}
              href="/account/link-in-bio"
              icon={icons.xLogo}
            />
          </YGroup.Item>
        </YGroup>
      </YStack>
      <YStack gap={'$3.5'}>
        <RowLabel>{t('links.sections.features')}</RowLabel>
        <YGroup bc={'$color1'} p={'$2'} $gtLg={{ p: '$3.5' }} {...shadowProps}>
          <YGroup.Item>
            <AccountNavLink
              text={t('links.items.sendtags')}
              href="/account/sendtag"
              icon={icons.slash}
            />
          </YGroup.Item>
          <YGroup.Item>
            <AccountNavLink text={t('links.items.contacts')} href="/contacts" icon={icons.group} />
          </YGroup.Item>
          <YGroup.Item>
            <AccountNavLink
              text={t('links.items.referrals')}
              href="/account/affiliate"
              icon={icons.dollar}
            />
          </YGroup.Item>
          <YGroup.Item>
            <AccountNavLink
              text={t('links.items.rewards')}
              href="/rewards"
              icon={icons.starOutline}
            />
          </YGroup.Item>
          {showSecretShop && (
            <YGroup.Item>
              <AccountNavLink
                text={t('links.items.secretShop')}
                href="/secret-shop"
                icon={icons.lock}
              />
            </YGroup.Item>
          )}
        </YGroup>
      </YStack>
      <YStack gap={'$3.5'}>
        <RowLabel>{t('links.sections.security')}</RowLabel>
        <YGroup bc={'$color1'} p={'$2'} $gtLg={{ p: '$3.5' }} {...shadowProps}>
          <YGroup.Item>
            <AccountNavLink
              text={t('links.items.passkeys')}
              href="/account/backup"
              icon={icons.fingerprint}
            />
          </YGroup.Item>
          <YGroup.Item>
            <AccountNavLink
              text={t('links.items.deleteAccount')}
              onPress={() => setDeleteDialogOpen(true)}
              icon={icons.trash}
            />
          </YGroup.Item>
        </YGroup>
      </YStack>
      <YStack gap={'$3.5'}>
        <RowLabel>{t('links.sections.support')}</RowLabel>
        <YGroup bc={'$color1'} p={'$2'} $gtLg={{ p: '$3.5' }} {...shadowProps}>
          <YGroup.Item>
            <AccountNavLink
              text={t('links.items.learnMore')}
              href="https://support.send.app/en/"
              target="_blank"
              icon={icons.infoCircle}
            />
          </YGroup.Item>
          <YGroup.Item>
            <AccountNavLink
              text={t('links.items.liveChat')}
              onPress={openChat}
              icon={icons.questionCircle}
            />
          </YGroup.Item>
        </YGroup>
      </YStack>
      <YStack gap={'$2'}>
        <Button onPress={handleSignOut} {...shadowProps}>
          <Button.Icon>
            <IconLogout {...iconProps} $theme-dark={{ color: '$gray12' }} />
          </Button.Icon>
          <Button.Text>{t('links.signOut')}</Button.Text>
        </Button>
        {Platform.OS !== 'web' && (
          <Paragraph size="$2" color="$color4" textAlign="center">
            Version {Application.nativeApplicationVersion}
          </Paragraph>
        )}
      </YStack>
      <AccountDeletionFlow open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen} />
    </YStack>
  )
})
