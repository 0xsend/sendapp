import {
  Avatar,
  Container,
  Paragraph,
  XStack,
  YStack,
  Label,
  SubmitButton,
  useMedia,
  Separator,
} from '@my/ui'
import { SchemaForm } from 'app/utils/SchemaForm'
import { useEditProfileMutation, ProfileSchema } from 'app/utils/useEditProfileMutation'
import { useUser } from 'app/utils/useUser'
import { SolitoImage } from 'solito/image'
import { UploadAvatar, UploadAvatarRefObject } from '../uploadProfileImage/screen'
import { useRef } from 'react'

export const EditProfile = () => {
  const { profile, user } = useUser()
  const userName = profile?.name
  const displayName = profile?.name
  const bio = profile?.about
  const isPublic = profile?.is_public
  const userID = user?.id
  const avatar_url = profile?.avatar_url
  const mutation = useEditProfileMutation(userID)

  const avatarRef = useRef<UploadAvatarRefObject>(null)

  const media = useMedia()

  return (
    <YStack w={'100%'} als={'center'}>
      <XStack $lg={{ display: 'none' }}>
        <Paragraph size={'$8'} fontWeight={'300'} color={'$color05'}>
          Edit Profile
        </Paragraph>
      </XStack>
      <XStack w={'100%'} $gtLg={{ paddingTop: '$6' }} $lg={{ jc: 'center' }}>
        <SchemaForm
          schema={ProfileSchema}
          props={{
            userName: {
              accessibilityLabel: 'User Name',
            },
            displayName: {
              accessibilityLabel: 'Display Name',
            },
            bio: {
              accessibilityLabel: 'Bio',
              placeholder: 'Tell us about yourself',
              fontStyle: 'italic',
            },
            isPublic: {
              // accessibilityLabel: 'Is Public',
              defaultChecked: isPublic ?? false,
            },
          }}
          defaultValues={{
            userName: userName ?? '',
            displayName: displayName ?? '',
            bio: bio ?? '',
            isPublic: isPublic ?? false,
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
              >
                SAVE
              </SubmitButton>
            </YStack>
          )}
        >
          {(fields) => (
            <>
              <XStack ai={'center'} gap={'$6'}>
                <UploadAvatar ref={avatarRef}>
                  <Avatar
                    size={'$7'}
                    borderRadius={'$3'}
                    $md={{ size: '$10', borderRadius: 12 }}
                    id="current-Image"
                  >
                    <SolitoImage
                      src={avatar_url ? avatar_url : ''}
                      alt="your avatar"
                      width={media.md ? 104 : 74}
                      height={media.md ? 104 : 74}
                    />
                  </Avatar>
                </UploadAvatar>
                <YStack gap={'$2'}>
                  <Label
                    size="$5"
                    htmlFor="current-Image"
                    fontFamily={'$mono'}
                    textTransform="uppercase"
                  >
                    Profile Picture
                  </Label>
                  <Paragraph color={'$color075'} fontSize={'$5'} fontStyle={'italic'}>
                    (Upload an image of your choice)
                  </Paragraph>
                  <Paragraph
                    color={'$primary'}
                    fontSize={'$5'}
                    fontWeight={'700'}
                    cursor={'pointer'}
                    onPress={() => avatarRef.current?.pickImage()}
                  >
                    change
                  </Paragraph>
                </YStack>
              </XStack>
              <Separator my={'$7'} $gtLg={{ display: 'none' }} />
              {Object.values(fields)}
            </>
          )}
        </SchemaForm>
      </XStack>
    </YStack>
  )
}
