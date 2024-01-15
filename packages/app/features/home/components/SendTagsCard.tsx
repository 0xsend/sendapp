import { Button, Card, H4, H6, Paragraph, Spinner, YStack } from '@my/ui'
import { IconXLogo } from 'app/components/icons'
import { getXPostHref } from 'app/utils/getReferralLink'
import { useConfirmedTags } from 'app/utils/tags'
import { useUser } from 'app/utils/useUser'
import { useLink } from 'solito/link'

export const SendTagsCard = () => {
  const user = useUser()
  const tags = useConfirmedTags()
  const checkoutLink = useLink({ href: '/checkout' })
  const referralLink = useLink({
    href: getXPostHref(user?.profile?.referral_code ?? ''),
  })
  return (
    <Card
      f={1}
      width="100%"
      $theme-dark={{ backgroundColor: '#2F2F2F' }}
      $gtMd={{ minWidth: 200, flex: 1, flexBasis: 0, br: '$6' }}
    >
      <Card.Header f={1} jc="space-between">
        <H6 fontWeight="400" size="$4" theme="alt2">
          Send Tags
        </H6>

        <YStack space="$4">
          {tags === undefined ? (
            <Spinner color="$color" />
          ) : tags.length === 0 ? (
            <YStack>
              <Paragraph>You have no tags yet.</Paragraph>

              <Button size="$2" {...checkoutLink}>
                Buy Send Tags
              </Button>
            </YStack>
          ) : (
            <YStack>
              {tags.map((tag) => (
                <H4 key={tag.name}>{tag.name}</H4>
              ))}
            </YStack>
          )}

          {tags && tags.length > 0 ? (
            <Button size="$4" {...referralLink}>
              <IconXLogo size="$1" />
              Post
            </Button>
          ) : null}
        </YStack>
      </Card.Header>
    </Card>
  )
}
