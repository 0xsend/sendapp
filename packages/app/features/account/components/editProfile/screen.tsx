import { ProfileAvatar, Paragraph, XStack, YStack, SubmitButton, Separator, Spinner } from '@my/ui'
import { SchemaForm } from 'app/utils/SchemaForm'
import { useProfileMutation, ProfileSchema } from 'app/utils/useProfileMutation'
import { useUser } from 'app/utils/useUser'
import { UploadAvatar, UploadAvatarRefObject } from '../uploadProfileImage/screen'
import { useRef } from 'react'
import { Tables } from '@my/supabase/database.types'

export const EditProfile = () => {
  const { profile } = useUser()

  return (
    <YStack w={'100%'} als={'center'} pt="$6" $gtMd={{ pt: '$10' }} $gtLg={{ pt: '$0' }}>
      <XStack $lg={{ display: 'none' }}>
        <Paragraph size={'$8'} fontWeight={'300'} color={'$color05'}>
          Edit Profile
        </Paragraph>
      </XStack>
      <XStack w={'100%'} $gtLg={{ paddingTop: '$6' }} $lg={{ jc: 'center' }}>
        {profile ? <EditProfileForm profile={profile} /> : <Spinner size="large" />}
      </XStack>
    </YStack>
  )
}
function EditProfileForm({ profile }: { profile: Tables<'profiles'> }) {
  const { id, name, about, is_public, avatar_url } = profile
  const mutation = useProfileMutation(id)
  const avatarRef = useRef<UploadAvatarRefObject>(null)

  return (
    <SchemaForm
      schema={ProfileSchema}
      props={{
        name: {
          accessibilityLabel: 'Name',
        },
        about: {
          accessibilityLabel: 'Bio',
          placeholder: 'Tell us about yourself',
        },
        isPublic: {
          defaultChecked: is_public !== null ? is_public : true,
        },
      }}
      defaultValues={{
        name: name ? name : '',
        about: about ? about : '',
        isPublic: is_public !== null ? is_public : true,
      }}
      onSubmit={(values) => mutation.mutate(values)}
      renderAfter={({ submit }) => (
        <YStack ai={'center'}>
          <SubmitButton
            f={1}
            marginTop={'$5'}
            px={'$12'}
            py={'$5'}
            fontWeight={'500'}
            onPress={() => submit()}
            theme="accent"
          >
            SAVE
          </SubmitButton>
        </YStack>
      )}
    >
      {(fields) => (
        <>
          <XStack ai={'center'} gap={'$6'} width={'100%'}>
            <UploadAvatar ref={avatarRef}>
              <ProfileAvatar avatarUrl={avatar_url ? avatar_url : undefined} />
            </UploadAvatar>
          </XStack>
          <Separator my={'$7'} $gtLg={{ display: 'none' }} />
          {Object.values(fields)}
        </>
      )}
    </SchemaForm>
  )
}
