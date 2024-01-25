import {
  Avatar,
  Button,
  Container,
  Image,
  Link,
  Paragraph,
  Theme,
  XStack,
  YStack,
  Label,
} from '@my/ui'
import { useThemeSetting } from '@tamagui/next-theme'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { IconClose } from 'app/components/icons'
import { SchemaForm, formFields } from 'app/utils/SchemaForm'
import { useSupabase } from 'app/utils/supabase/useSupabase'
import { useUser } from 'app/utils/useUser'
import { useForm } from 'react-hook-form'
import { SolitoImage } from 'solito/image'
import { z } from 'zod'
import { UploadAvatar } from '../uploadProfileImage/screen'

const ProfileSchema = z.object({
  name: formFields.text.describe('Name'),
  about: formFields.textarea.describe('About'),
})

export const EditProfile = () => {
  const { profile, user } = useUser()
  const supabase = useSupabase()
  const name = profile?.name
  const about = profile?.about
  const userID = user?.id
  const avatar_url = profile?.avatar_url
  const queryClient = useQueryClient()
  const form = useForm<z.infer<typeof ProfileSchema>>()
  const { resolvedTheme } = useThemeSetting()
  const mutation = useMutation({
    async mutationFn(data: z.infer<typeof ProfileSchema>) {
      await supabase
        .from('profiles')
        .update({ name: data.name, about: data.about })
        .eq('id', userID ? userID : '')
    },
    async onSuccess() {
      await queryClient.invalidateQueries(['profile'])
      window.location.href = '/settings'
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
                'aria-label': 'Name',
                borderWidth: 1,
              },
              about: {
                'aria-label': 'About',
                borderWidth: 1,
              },
            }}
            defaultValues={{
              name: name ?? '',
              about: about ?? '',
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
