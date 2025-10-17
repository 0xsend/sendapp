import { AccountNavLink } from './AccountNavLink'
import { useSupabase } from 'app/utils/supabase/useSupabase'
import { type ColorTokens, PrimaryButton, type SizeTokens, YGroup, YStack } from '@my/ui'
import {
  IconAccount,
  IconDollar,
  IconFingerprint,
  IconIdCard,
  IconInfoCircle,
  IconLogout,
  IconQuestionCircle,
  IconSlash,
  IconStarOutline,
  IconWorldSearch,
  IconXLogo,
} from 'app/components/icons'
import { RowLabel } from 'app/components/layout/RowLabel'
import useIntercom from 'app/utils/intercom/useIntercom'
import { memo, useCallback, useMemo } from 'react'

const iconProps = {
  size: '$1.5' as SizeTokens,
  color: '$primary' as ColorTokens,
  '$theme-light': {
    color: '$color12' as ColorTokens,
  },
}

export const AccountLinks = memo(function AccountLinks(): JSX.Element {
  const supabase = useSupabase()
  const { openChat } = useIntercom()

  const handleSignOut = useCallback(() => {
    void supabase.auth.signOut()
  }, [supabase.auth])

  const icons = useMemo(
    () => ({
      account: <IconAccount {...iconProps} />,
      idCard: <IconIdCard {...iconProps} />,
      xLogo: <IconXLogo {...iconProps} />,
      fingerprint: <IconFingerprint {...iconProps} />,
      slash: <IconSlash {...iconProps} />,
      starOutline: <IconStarOutline {...iconProps} />,
      worldSearch: <IconWorldSearch {...iconProps} />,
      dollar: <IconDollar {...iconProps} scale={1.2} />,
      infoCircle: <IconInfoCircle {...iconProps} />,
      questionCircle: <IconQuestionCircle {...iconProps} />,
    }),
    []
  )

  return (
    <YStack gap={'$5'} pb={'$3.5'}>
      <YStack gap={'$3.5'}>
        <RowLabel>Settings</RowLabel>
        <YGroup elevation={'$0.75'} bc={'$color1'} p={'$2'} $gtLg={{ p: '$3.5' }}>
          <YGroup.Item>
            <AccountNavLink text="Profile" href="/account/edit-profile" icon={icons.account} />
          </YGroup.Item>
          <YGroup.Item>
            <AccountNavLink
              text="Personal Information"
              href="/account/personal-info"
              icon={icons.idCard}
            />
          </YGroup.Item>
          <YGroup.Item>
            <AccountNavLink text="Language" href="/account/language" icon={icons.worldSearch} />
          </YGroup.Item>
          <YGroup.Item>
            <AccountNavLink text="Link In Bio" href="/account/link-in-bio" icon={icons.xLogo} />
          </YGroup.Item>
          <YGroup.Item>
            <AccountNavLink text="Passkeys" href="/account/backup" icon={icons.fingerprint} />
          </YGroup.Item>
          <YGroup.Item>
            <AccountNavLink text="Sendtags" href="/account/sendtag" icon={icons.slash} />
          </YGroup.Item>
          <YGroup.Item>
            <AccountNavLink text="Rewards" href="/rewards" icon={icons.starOutline} />
          </YGroup.Item>
          <YGroup.Item>
            <AccountNavLink text="Referrals" href="/account/affiliate" icon={icons.dollar} />
          </YGroup.Item>
        </YGroup>
      </YStack>
      <YStack gap={'$3.5'}>
        <RowLabel>Support</RowLabel>
        <YGroup elevation={'$0.75'} bc={'$color1'} p={'$2'} $gtLg={{ p: '$3.5' }}>
          <YGroup.Item>
            <AccountNavLink
              text="Learn more about Send"
              href="https://support.send.app/en/"
              target="_blank"
              icon={icons.infoCircle}
            />
          </YGroup.Item>
          <YGroup.Item>
            <AccountNavLink
              text="Live Chat Support"
              onPress={openChat}
              icon={icons.questionCircle}
            />
          </YGroup.Item>
        </YGroup>
      </YStack>
      <PrimaryButton onPress={handleSignOut}>
        <PrimaryButton.Icon>
          <IconLogout {...iconProps} color={'$black'} />
        </PrimaryButton.Icon>
        <PrimaryButton.Text>sign out</PrimaryButton.Text>
      </PrimaryButton>
    </YStack>
  )
})
