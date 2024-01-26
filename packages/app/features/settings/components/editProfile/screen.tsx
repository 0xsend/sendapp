import { Avatar, Button, Container, Paragraph, XStack, YStack, Label } from '@my/ui'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useRouter } from 'solito/router'
import { SchemaForm, formFields } from 'app/utils/SchemaForm'
import { useSupabase } from 'app/utils/supabase/useSupabase'
import { useUser } from 'app/utils/useUser'
import { SolitoImage } from 'solito/image'
import { z } from 'zod'
import { UploadAvatar } from '../uploadProfileImage/screen'

const ProfileSchema = z.object({
  name: formFields.text.describe('Name'),
  about: formFields.textarea.describe('About'),
  isPublic: formFields.boolean_checkbox.describe('IsPublic'),
})

export const EditProfile = () => {
  const { profile, user } = useUser()
  const supabase = useSupabase()
  const router = useRouter()
  const name = profile?.name
  const about = profile?.about
  const isPublic = profile?.is_public
  const userID = user?.id
  const avatar_url = profile?.avatar_url
  const queryClient = useQueryClient()
  const mutation = useMutation({
    async mutationFn(data: z.infer<typeof ProfileSchema>) {
      await supabase
        .from('profiles')
        .update({
          name: data.name,
          about: data.about,
          is_public: data.isPublic,
        })
        .eq('id', userID ? userID : '')
    },
    async onSuccess() {
      await queryClient.invalidateQueries(['profile'])
      router.push('/settings')
    },
  })

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
                <Button f={1} marginTop={'$5'} onPress={() => submit()}>
                  Update Profile
                </Button>
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
