import { Avatar, Container, Paragraph, XStack, YStack, Label, SubmitButton } from '@my/ui'
import { SchemaForm } from 'app/utils/SchemaForm'
import { useEditProfileMutation, ProfileSchema } from 'app/utils/useEditProfileMutation'
import { useUser } from 'app/utils/useUser'
import { SolitoImage } from 'solito/image'
import { UploadAvatar } from '../uploadProfileImage/screen'

export const EditProfile = () => {
  const { profile, user } = useUser()
  const name = profile?.name
  const about = profile?.about
  const isPublic = profile?.is_public
  const userID = user?.id
  const avatar_url = profile?.avatar_url
  const mutation = useEditProfileMutation(userID)

  return (
    <Container>
      <YStack w={'100%'} ai={'center'}>
        <XStack w={'100%'} jc={'space-between'} marginHorizontal={'5%'}>
          <Paragraph size={'$9'} fontWeight={'700'}>
            Edit Profile
          </Paragraph>
        </XStack>
        <XStack w={'100%'} marginHorizontal={'5%'} paddingTop={'$6'}>
          <SchemaForm
            schema={ProfileSchema}
            props={{
              name: {
                accessibilityLabel: 'Name',
                borderWidth: 1,
              },
              about: {
                accessibilityLabel: 'About',
                borderWidth: 1,
              },
              isPublic: {
                accessibilityLabel: 'IsPublic',
                borderWidth: 1,
                defaultChecked: isPublic,
              },
            }}
            defaultValues={{
              name: name ?? '',
              about: about ?? '',
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
                <YStack>
                  <Label size="$3" htmlFor="current-Image">
                    Image
                  </Label>
                  <UploadAvatar>
                    <Avatar circular size={128}>
                      <SolitoImage
                        src={avatar_url ? avatar_url : ''}
                        alt="your avatar"
                        width={128}
                        height={128}
                      />
                    </Avatar>
                  </UploadAvatar>
                </YStack>
                {Object.values(fields)}
              </>
            )}
          </SchemaForm>
        </XStack>
      </YStack>
    </Container>
  )
}
