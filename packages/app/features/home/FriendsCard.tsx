import {
  Avatar,
  Card,
  type CardProps,
  Paragraph,
  Spinner,
  ThemeableStack,
  XStack,
  type XStackProps,
} from '@my/ui'

import { ChevronRight } from '@tamagui/lucide-icons'
import { type LinkProps, useLink } from 'solito/link'
import { useFriends } from '../affiliate/utils/useFriends'
import { IconAccount } from 'app/components/icons'
import { HomeBodyCard } from './screen'

export const FriendsCard = ({ href, ...props }: Omit<CardProps & LinkProps, 'children'>) => {
  const linkProps = useLink({ href })
  const limit = 3
  const { data, isLoading } = useFriends(limit)

  return (
    <HomeBodyCard {...linkProps} {...props}>
      <Card.Header padded pb={0} fd="row" ai="center" jc="space-between">
        <Paragraph fontSize={'$5'} fontWeight="400">
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
          <Spinner size="small" />
        ) : (
          <XStack ai="center" jc="space-between">
            {data?.friends && <OverlappingFriendAvatars friends={data.friends} />}
            <ThemeableStack
              circular
              ai="center"
              jc="center"
              bc="$color0"
              w={'$3.5'}
              h="$3.5"
              mih={0}
              miw={0}
            >
              <Paragraph fontSize={'$4'} fontWeight="500">
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
      {friends.map((friend, index) => (
        <Avatar
          testID="avatar"
          key={friend.tag || `empty-${index}`}
          circular
          mr={'$-5'}
          ai="center"
          jc="center"
          bc="$color2"
          borderWidth="$0.75"
          borderColor="$color1"
        >
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
        </Avatar>
      ))}
    </XStack>
  )
}
