import { Card, type CardProps, Paragraph, XStack } from '@my/ui'

import { ChevronRight } from '@tamagui/lucide-icons'
import { type LinkProps, useLink } from 'solito/link'

export const FriendsCard = ({ href, ...props }: Omit<CardProps & LinkProps, 'children'>) => {
  const linkProps = useLink({ href })

  return (
    <Card
      elevate
      hoverStyle={{ scale: 0.925 }}
      pressStyle={{ scale: 0.875 }}
      animation="bouncy"
      size={'$5'}
      br="$7"
      {...linkProps}
      {...props}
    >
      <Card.Header padded fd="row" ai="center" jc="space-between">
        <Paragraph fontSize={'$7'} fontWeight="400">
          Friends
        </Paragraph>
        <XStack flex={1} />
        <ChevronRight
          size={'$1.5'}
          color={'$lightGrayTextField'}
          $theme-light={{ color: '$darkGrayTextField' }}
        />
      </Card.Header>
      <Card.Footer padded />
    </Card>
  )
}
