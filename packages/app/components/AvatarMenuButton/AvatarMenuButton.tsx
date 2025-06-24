import { Avatar, LinkableAvatar, Spinner } from '@my/ui'
import { IconAccount } from 'app/components/icons'
import { useUser, type UseUserReturn } from 'app/utils/useUser'

interface AvatarMenuButtonProps {
  profile?: UseUserReturn['profile']
}

const AvatarMenuButton = ({ profile }: AvatarMenuButtonProps) => {
  const { isLoading } = useUser()

  if (isLoading) return <Spinner size="small" color={'$color12'} alignSelf="center" p="$3" />

  return (
    <LinkableAvatar
      elevation={5}
      href={'/account'}
      size={'$3.5'}
      circular={true}
      backgroundColor={'$color1'}
    >
      <Avatar.Image src={profile?.avatar_url ?? ''} w="100%" h="100%" objectFit="cover" />
      <Avatar.Fallback jc={'center'} ai="center">
        <IconAccount size={'$2'} />
      </Avatar.Fallback>
    </LinkableAvatar>
  )
}

export default AvatarMenuButton
