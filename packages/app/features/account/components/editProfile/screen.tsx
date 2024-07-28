import {
  ProfileAvatar,
  Paragraph,
  XStack,
  YStack,
  SubmitButton,
  Separator,
  Spinner,
  ButtonIcon,
  AnimatePresence,
  ButtonText,
  Button,
} from '@my/ui'
import { SchemaForm } from 'app/utils/SchemaForm'
import { useProfileMutation, ProfileSchema } from 'app/utils/useProfileMutation'
import { useUser } from 'app/utils/useUser'
import { UploadAvatar, type UploadAvatarRefObject } from '../uploadProfileImage/screen'
import { useEffect, useRef, useState } from 'react'
import type { Tables } from '@my/supabase/database.types'
import { CheckCheck } from '@tamagui/lucide-icons'

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
  const { mutate, isSuccess, error } = useProfileMutation(id)
  const avatarRef = useRef<UploadAvatarRefObject>(null)

  const [hasSaved, setHasSaved] = useState(false)

  useEffect(() => {
    if (isSuccess) setHasSaved(true)
    setTimeout(() => {
      setHasSaved(false)
    }, 2000)
  }, [isSuccess])

  return (
    <SchemaForm
      schema={ProfileSchema}
      props={{
        name: {
          'aria-label': 'Name',
        },
        about: {
          'aria-label': 'Bio',
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
      onSubmit={(values) => mutate(values)}
      renderAfter={({ submit }) => (
        <YStack ai={'center'}>
          {error && <Paragraph theme="red">{error.message}</Paragraph>}
          <AnimatePresence exitBeforeEnter>
            {hasSaved ? (
              <Button
                theme={'green'}
                circular={true}
                h="$5"
                w="$5"
                mt={'$5'}
                disabled={true}
                key="enter"
                animateOnly={['scale']}
                animation="bouncy"
                enterStyle={{ scale: 1 }}
                exitStyle={{ scale: 0.95 }}
              >
                <ButtonIcon>
                  <CheckCheck size={'$2'} />
                </ButtonIcon>
              </Button>
            ) : (
              <SubmitButton
                f={1}
                marginTop={'$5'}
                px={'$12'}
                py={'$5'}
                fontWeight={'500'}
                onPress={() => submit()}
                theme="green"
              >
                {hasSaved ? (
                  <ButtonIcon>
                    <CheckCheck size={'$2'} />
                  </ButtonIcon>
                ) : (
                  <ButtonText>SAVE</ButtonText>
                )}
              </SubmitButton>
            )}
          </AnimatePresence>
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
