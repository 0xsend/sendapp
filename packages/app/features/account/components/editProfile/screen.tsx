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
  H1,
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
    <YStack w={'100%'} als={'center'}>
      <XStack $lg={{ maw: 600 }} mx="auto" w={'100%'} mb={'$size.2'} $gtLg={{ mb: '$size.3.5' }}>
        <H1 size={'$9'} fontWeight={'600'} color="$color12">
          My Profile
        </H1>
      </XStack>
      <XStack w={'100%'} $lg={{ jc: 'center' }}>
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
          bc: '$color0',
          labelProps: {
            color: '$color10',
          },
        },
        about: {
          'aria-label': 'Bio',
          placeholder: 'Tell us about yourself',
          backgroundColor: '$color0',
          rows: 1,
          labelProps: {
            color: '$color10',
          },
        },
        isPublic: {
          defaultChecked: is_public !== null ? is_public : true,
          labelProps: {
            color: '$color10',
          },
        },
      }}
      defaultValues={{
        name: name ? name : '',
        about: about ? about : '',
        isPublic: is_public !== null ? is_public : true,
      }}
      onSubmit={(values) => mutate(values)}
      renderAfter={({ submit }) => (
        <YStack ai={'flex-start'}>
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
                borderRadius={'$3'}
                px={'$size.1.5'}
                onPress={() => submit()}
                theme="green"
              >
                {hasSaved ? (
                  <ButtonIcon>
                    <CheckCheck size={'$2'} />
                  </ButtonIcon>
                ) : (
                  <ButtonText size={'$5'} fontWeight={500} ff={'$mono'}>
                    SAVE
                  </ButtonText>
                )}
              </SubmitButton>
            )}
          </AnimatePresence>
        </YStack>
      )}
    >
      {(fields) => (
        <>
          <XStack gap={'$6'} width={'100%'}>
            <UploadAvatar ref={avatarRef}>
              <ProfileAvatar
                avatarUrl={avatar_url ? avatar_url : undefined}
                $gtMd={{ size: 88 }}
                size={88}
              />
            </UploadAvatar>
            <YStack jc={'space-between'} ai={'flex-start'}>
              <YStack>
                <Paragraph
                  ff={'$mono'}
                  size={'$5'}
                  tt={'uppercase'}
                  fontWeight={500}
                  color={'$color10'}
                >
                  Profile Picture
                </Paragraph>
                <Paragraph color={'$color9'} $theme-light={{ color: '$color10' }} size={'$5'}>
                  (Upload an image of your choice)
                </Paragraph>
              </YStack>

              <Button unstyled onPress={() => avatarRef.current?.pickImage()}>
                <Button.Text
                  textDecorationLine="underline"
                  color="$primary"
                  $theme-light={{ color: '$color12' }}
                  size={'$5'}
                >
                  Change
                </Button.Text>
              </Button>
            </YStack>
          </XStack>
          <Separator my={'$7'} $gtLg={{ display: 'none' }} />
          {Object.values(fields)}
        </>
      )}
    </SchemaForm>
  )
}
