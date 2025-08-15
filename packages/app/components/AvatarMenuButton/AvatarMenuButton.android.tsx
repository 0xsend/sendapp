import { Avatar, LinkableAvatar, Spinner } from '@my/ui'
import { IconAccount } from 'app/components/icons'
import { useUser, type UseUserReturn } from 'app/utils/useUser'

interface AvatarMenuButtonProps {
  profile?: UseUserReturn['profile']
}

// due to current bug need to add fallback manually when url is falsy on android
// https://github.com/tamagui/tamagui/issues/2757
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
      {profile?.avatar_url ? (
        <>
          <Avatar.Image src={profile.avatar_url} w="100%" h="100%" objectFit="cover" />
          <Avatar.Fallback jc={'center'} ai="center">
            <IconAccount size={'$2'} />
          </Avatar.Fallback>
        </>
      ) : (
        <IconAccount size={'$2'} />
      )}
    </LinkableAvatar>
  )
}

export default AvatarMenuButton
