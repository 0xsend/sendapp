import {
  Avatar,
  Card,
  type CardProps,
  Paragraph,
  Shimmer,
  ThemeableStack,
  View,
  XStack,
  type XStackProps,
} from '@my/ui'

import { ChevronRight } from '@tamagui/lucide-icons'
import { useLink } from 'solito/link'
import { useFriends } from '../affiliate/utils/useFriends'
import { IconAccount } from 'app/components/icons'
import { HomeBodyCard } from './screen'
import { useHoverStyles } from 'app/utils/useHoverStyles'
import { Platform } from 'react-native'

export const FRIENDS_CARD_HREF = '/account/affiliate'

export const FriendsCard = ({ ...props }: Omit<CardProps, 'children'>) => {
  const linkProps = useLink({ href: FRIENDS_CARD_HREF })
  const limit = 3
  const { data, isLoading } = useFriends(limit)
  const hoverStyles = useHoverStyles()

  return (
    <HomeBodyCard {...linkProps} {...props}>
      <Card.Header padded pb={0} fd="row" ai="center" jc="space-between">
        <Paragraph
          fontSize={'$5'}
          fontWeight="400"
          color={'$lightGrayTextField'}
          $theme-light={{ color: '$darkGrayTextField' }}
        >
          Referrals
        </Paragraph>
        <XStack flex={1} />
        <ChevronRight
          size={'$1'}
          color={'$lightGrayTextField'}
          $theme-light={{ color: '$darkGrayTextField' }}
        />
      </Card.Header>
      <Card.Footer padded pt={0} fd="column">
        {isLoading ? (
          <Shimmer br={100} w={35} h={35} als="flex-end" />
        ) : (
          <XStack ai="center" jc="space-between">
            {data?.friends && <OverlappingFriendAvatars friends={data.friends} />}
            <ThemeableStack
              circular
              ai="center"
              jc="center"
              bc={hoverStyles.backgroundColor}
              w={'$2.5'}
              h="$2.5"
              mih={0}
              miw={0}
            >
              <Paragraph fontSize={'$2'} fontWeight="400">
                {`${data?.count ?? 0}`}
              </Paragraph>
            </ThemeableStack>
          </XStack>
        )}
      </Card.Footer>
    </HomeBodyCard>
  )
}

type Friend = {
  tag?: string
  avatar_url?: string
}

function OverlappingFriendAvatars({ friends, ...props }: { friends: Friend[] } & XStackProps) {
  return (
    <XStack ai="center" {...props}>
      {friends.map((friend, index) => {
        return (
          <Avatar
            testID="avatar"
            key={friend.tag || `empty-${index}`}
            circular
            mr={-8}
            ai="center"
            jc="center"
            bc="$color2"
            borderWidth="$0.75"
            borderColor="$color1"
            size={'$2.5'}
          >
            {Platform.OS === 'android' && !friend.avatar_url ? (
              <IconAccount size="$2" color="$olive" />
            ) : (
              <>
                <Avatar.Image
                  testID="avatarImage"
                  accessibilityLabel={friend?.tag ?? '??'}
                  accessibilityRole="image"
                  accessible
                  src={friend.avatar_url}
                />
                <Avatar.Fallback jc="center" ai="center" boc={'$color1'}>
                  <IconAccount size="$2" color="$olive" />
                </Avatar.Fallback>
              </>
            )}
          </Avatar>
        )
      })}
    </XStack>
  )
}
