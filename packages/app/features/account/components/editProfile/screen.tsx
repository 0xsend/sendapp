import { Avatar, Container, Paragraph, XStack, YStack, Label, SubmitButton } from '@my/ui'
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

  return (
    <Container>
      <YStack w={'100%'} ai={'center'}>
        <XStack w={'100%'} jc={'space-between'} marginHorizontal={'5%'}>
          <Paragraph size={'$8'} fontWeight={'300'} color={'$color05'}>
            Edit Profile
          </Paragraph>
        </XStack>
        <XStack w={'100%'} marginHorizontal={'5%'} paddingTop={'$6'}>
          <SchemaForm
            schema={ProfileSchema}
            props={{
              userName: {
                accessibilityLabel: 'User Name',
                backgroundColor: '#081619',
                borderWidth: 0,
                fontSize: '$5',
                color: '$color12',
              },
              displayName: {
                accessibilityLabel: 'Display Name',
                backgroundColor: '#081619',
                borderWidth: 0,
                fontSize: '$5',
                color: '$color12',
              },
              Bio: {
                accessibilityLabel: 'Bio',
                backgroundColor: '#081619',
                borderWidth: 0,
                fontSize: '$5',
                rows: 1,
              },
              isPublic: {
                accessibilityLabel: 'Is Public',
                backgroundColor: '#081619',
                borderWidth: 0,
                defaultChecked: isPublic,
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
              <XStack
                jc={'space-between'}
                ai={'center'}
                $lg={{ flexDirection: 'column' }}
                $gtLg={{ flexDirection: 'row' }}
              >
                <SubmitButton f={1} marginTop={'$5'} onPress={() => submit()}>
                  Update Profile
                </SubmitButton>
              </XStack>
            )}
          >
            {(fields) => (
              <>
                <XStack ai={'center'} gap={'$6'}>
                  <UploadAvatar ref={avatarRef}>
                    <Avatar size={'$7'} borderRadius={'$3'} id="current-Image">
                      <SolitoImage
                        src={avatar_url ? avatar_url : ''}
                        alt="your avatar"
                        width={74}
                        height={74}
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
                {Object.values(fields)}
              </>
            )}
          </SchemaForm>
        </XStack>
      </YStack>
    </Container>
  )
}
