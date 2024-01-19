import {
  Button,
  Container,
  KVTable,
  Paragraph,
  XStack,
  YStack,
  useMedia,
  useToastController,
} from '@my/ui'
import { IconCopy } from 'app/components/icons'
import { getReferralHref } from 'app/utils/getReferralLink'

const users = [
  {
    rank: 1,
    sendTag: '0xUser',
    points: 100,
    referralLink: 'send.it/referral/132442314',
    profile: {
      referral_code: '132442314',
    },
  },
  {
    rank: 2,
    sendTag: '0xUser',
    points: 100,
    referralLink: 'send.it/referral/132442314',
    profile: {
      referral_code: '132442314',
    },
  },
  {
    rank: 3,
    sendTag: '0xUser',
    points: 100,
    referralLink: 'send.it/referral/132442314',
    profile: {
      referral_code: '132442314',
    },
  },
  {
    rank: 4,
    sendTag: '0xUser',
    points: 100,
    referralLink: 'send.it/referral/132442314',
    profile: {
      referral_code: '132442314',
    },
  },
  {
    rank: 5,
    sendTag: '0xUser',
    points: 100,
    referralLink: 'send.it/referral/132442314',
    profile: {
      referral_code: '132442314',
    },
  },
  {
    rank: 6,
    sendTag: '0xUser',
    points: 100,
    referralLink: 'send.it/referral/132442314',
    profile: {
      referral_code: '132442314',
    },
  },
  {
    rank: 7,
    sendTag: '0xUser',
    points: 100,
    referralLink: 'send.it/referral/132442314',
    profile: {
      referral_code: '132442314',
    },
  },
  {
    rank: 8,
    sendTag: '0xUser',
    points: 100,
    referralLink: 'send.it/referral/132442314',
    profile: {
      referral_code: '132442314',
    },
  },
]

export function LeaderboardScreen() {
  return (
    <Container>
      <YStack f={1} width={'100%'} py="$4" space="$4">
        <LeaderboardSection />
      </YStack>
    </Container>
  )
}

function LeaderboardSection() {
  const media = useMedia()
  return (
    <YStack gap="$6" $gtSm={{ p: '$8', bg: '$backgroundStrong' }} br="$8">
      {media.gtSm ? (
        <>
          <LeaderBoardHeader /> <LeaderboardListWide />
        </>
      ) : (
        <LeaderboardListNarrow />
      )}
    </YStack>
  )
}

function LeaderBoardHeader() {
  return (
    <XStack gap="$3" ai="center" jc="center">
      <Paragraph w="20%" f={1} mb="0" size="$6" lineHeight="$4" color={'$gray8'}>
        Rank
      </Paragraph>
      <Paragraph w="20%" f={1} mb="0" size="$6" lineHeight="$4" color={'$gray8'} ta="center">
        Send Tag
      </Paragraph>
      <Paragraph w="20%" f={1} mb="0" size="$6" lineHeight="$4" color={'$gray8'} ta="center">
        Points
      </Paragraph>
      <Paragraph w="20%" f={2} mb="0" size="$6" lineHeight="$4" color={'$gray8'} ta="right">
        Referral Link
      </Paragraph>
    </XStack>
  )
}

function LeaderboardListWide() {
  const toast = useToastController()

  return users.map((user) => {
    const referralHref = getReferralHref(user?.profile?.referral_code ?? '')
    return (
      <XStack gap="$3" ai="center" jc={'center'} key={user.sendTag}>
        <Paragraph w="20%" f={1} mb="0" size="$6" lineHeight="$4">
          {user.rank}
        </Paragraph>
        <Paragraph w="20%" f={1} mb="0" size="$6" lineHeight="$4" ta="center">
          {user.sendTag}
        </Paragraph>
        <Paragraph w="20%" f={1} mb="0" size="$6" lineHeight="$4" ta="center">
          {user.points}
        </Paragraph>
        <Paragraph
          w="20%"
          f={2}
          mb="0"
          size="$6"
          lineHeight="$4"
          ta="right"
          color={'$gold8'}
          onPress={() => {
            if (user?.profile?.referral_code) {
              try {
                // write the referral link to clipboard
                // @TODO: implement a native clipboard solution
                navigator.clipboard.writeText(referralHref)
              } catch (e) {
                console.warn(e)
                prompt('Copy to clipboard: Ctrl+C, Enter', referralHref)
              }
              toast.show('Copied your referral link to clipboard')
            }
          }}
        >
          {user.referralLink}
        </Paragraph>
      </XStack>
    )
  })
}

function LeaderboardListNarrow() {
  const toast = useToastController()

  return users.map((user) => {
    const referralHref = getReferralHref(user?.profile?.referral_code ?? '')
    return (
      <XStack
        gap="$3"
        ai="center"
        jc={'center'}
        key={user.sendTag}
        onPress={() => {
          if (user?.profile?.referral_code) {
            try {
              // write the referral link to clipboard
              // @TODO: implement a native clipboard solution
              navigator.clipboard.writeText(referralHref)
            } catch (e) {
              console.warn(e)
              prompt('Copy to clipboard: Ctrl+C, Enter', referralHref)
            }
            toast.show('Copied referral link to clipboard')
          }
        }}
      >
        <Paragraph mb="0" size="$9" lineHeight="$4" fontWeight={'bold'}>
          {user.rank}
        </Paragraph>
        <Paragraph f={1} mb="0" size="$6" lineHeight="$4" ta="center">
          {user.sendTag}
        </Paragraph>
        <Paragraph mb="0" size="$6" lineHeight="$4" ta="center">
          {user.points}
        </Paragraph>
        <Button mx={0} px={0} icon={<IconCopy />} bg={'$backgroundTransparent'} />
      </XStack>
    )
  })
}
