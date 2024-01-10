import {
  Avatar,
  Button,
  Container,
  Image,
  Paragraph,
  SubmitButton,
  Theme,
  XStack,
  YStack,
  useToastController,
} from '@my/ui'
import { useThemeSetting } from '@tamagui/next-theme'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { IconClose } from 'app/components/icons'
import { SchemaForm, formFields } from 'app/utils/SchemaForm'
import { useSupabase } from 'app/utils/supabase/useSupabase'
import { useUser } from 'app/utils/useUser'
import { useForm } from 'react-hook-form'
import { useRouter } from 'solito/router'
import { z } from 'zod'
import { UploadAvatar } from '../uploadProfileImage/screen'
// import { SolitoImage } from 'solito/image'

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
  const router = useRouter()
  const mutation = useMutation({
    async mutationFn(data: z.infer<typeof ProfileSchema>) {
      await supabase
        .from('profiles')
        .update({ name: data.name, about: data.about })
        .eq('id', userID ? userID : '')
    },
    async onSuccess() {
      await queryClient.invalidateQueries(['profile'])
      router.back()
    },
  })

  return (
    <Theme name="send">
      <XStack
        w={'90%'}
        ai={'center'}
        jc={'space-between'}
        marginHorizontal={'5%'}
        paddingTop={'$6'}
      >
        <Paragraph size={'$9'} theme={'alt1'} fontWeight={'700'}>
          Edit Profile
        </Paragraph>
        <XStack onPress={() => router.push('/account')}>
          <IconClose color={'white'} />
        </XStack>
      </XStack>
      <SchemaForm
        schema={ProfileSchema}
        props={{
          name: {
            autoFocus: !!name,
            borderColor: 'rgba(195, 171, 142, 0.6)',
            borderWidth: 1,
          },
          about: {
            autoFocus: !!about,
            borderColor: 'rgba(195, 171, 142, 0.6)',
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
            <Button
              f={1}
              br={'$radius.true'}
              bw={'$0.5'}
              borderColor={'#C3AB8E'}
              bg={'transparent'}
              shadowColor={'rgba(0, 0, 0, 0.1)'}
              shadowOffset={{ width: 0, height: 4 }}
              shadowRadius={8}
              shadowOpacity={0.1}
              marginTop={'$5'}
              w={'60%'}
              onPress={() => submit()}
            >
              <Paragraph color={'$primary'} fontWeight={'700'}>
                Update Profile
              </Paragraph>
            </Button>
          </XStack>
        )}
      >
        {(fields) => (
          <>
            <YStack>
              <Paragraph theme={'alt1'} fontWeight={'400'} marginBottom={'$5'}>
                Image
              </Paragraph>
              <UploadAvatar>
                <Avatar circular size={128}>
                  <Image source={{ uri: avatar_url ? avatar_url : '' }} width={128} height={128} />
                </Avatar>
              </UploadAvatar>
            </YStack>
            {Object.values(fields)}
          </>
        )}
      </SchemaForm>
    </Theme>
  )
}
