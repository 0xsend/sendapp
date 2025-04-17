import {
  Button,
  Checkbox,
  FadeCard,
  Paragraph,
  ProfileAvatar,
  Separator,
  Spinner,
  SubmitButton,
  XStack,
  YStack,
} from '@my/ui'
import { SchemaForm } from 'app/utils/SchemaForm'
import { ProfileSchema, useProfileMutation } from 'app/utils/useProfileMutation'
import { useUser } from 'app/utils/useUser'
import { UploadAvatar, type UploadAvatarRefObject } from '../uploadProfileImage/screen'
import { useRef, useState } from 'react'
import type { Tables } from '@my/supabase/database.types'
import { Check } from '@tamagui/lucide-icons'
import { SettingsHeader } from 'app/features/account/settings/components/SettingsHeader'
import { ReadOnlyFieldWithLabel } from 'app/features/account/settings/components/ReadOnlyFieldWithLabel'
import { FieldWithLabel } from 'app/features/account/settings/components/FieldWithLabel'
import { useForm } from 'react-hook-form'
import type { z } from 'zod'

enum FormState {
  Overview = 'Overview',
  ProfileForm = 'ProfileForm',
}

export const EditProfile = () => {
  const [formState, setFormState] = useState<FormState>(FormState.Overview)
  const { profile } = useUser()

  return (
    <YStack w={'100%'}>
      <YStack gap={'$3.5'}>
        <SettingsHeader>Profile</SettingsHeader>
        {(() => {
          switch (true) {
            case !profile:
              return <Spinner size="large" />
            case formState === FormState.Overview:
              return (
                <Overview profile={profile} onPress={() => setFormState(FormState.ProfileForm)} />
              )
            case formState === FormState.ProfileForm:
              return (
                <EditProfileForm
                  profile={profile}
                  onSave={() => setFormState(FormState.Overview)}
                />
              )
          }
        })()}
      </YStack>
    </YStack>
  )
}

const Overview = ({ profile, onPress }: { profile: Tables<'profiles'>; onPress: () => void }) => {
  const { name, about, is_public, avatar_url } = profile
  const avatarRef = useRef<UploadAvatarRefObject>(null)

  return (
    <YStack gap={'$5'}>
      <FadeCard>
        <XStack gap={'$5'} width={'100%'}>
          <UploadAvatar ref={avatarRef}>
            <ProfileAvatar
              avatarUrl={avatar_url ? avatar_url : undefined}
              $gtMd={{ size: 88 }}
              size={88}
            />
          </UploadAvatar>
          <YStack gap={'$2'} ai={'flex-start'}>
            <YStack>
              <Paragraph
                size={'$5'}
                fontWeight={500}
                color={'$lightGrayTextField'}
                $theme-light={{ color: '$darkGrayTextField' }}
              >
                Profile Picture
              </Paragraph>
            </YStack>
            <Button unstyled onPress={() => avatarRef.current?.pickImage()}>
              <Button.Text
                textDecorationLine="underline"
                color="$primary"
                $theme-light={{ color: '$color12' }}
                size={'$5'}
              >
                Update
              </Button.Text>
            </Button>
          </YStack>
        </XStack>
        <FieldWithLabel label={'Name'}>
          <Paragraph size={'$8'} fontWeight={'500'}>
            {name || '-'}
          </Paragraph>
        </FieldWithLabel>
        <Separator boc={'$silverChalice'} $theme-light={{ boc: '$darkGrayTextField' }} />
        <ReadOnlyFieldWithLabel label={'About'} text={about || '-'} />
        <Separator boc={'$silverChalice'} $theme-light={{ boc: '$darkGrayTextField' }} />
        <XStack gap={'$3'} ai={'center'}>
          <Checkbox
            disabled={true}
            checked={!!is_public}
            borderWidth={0}
            backgroundColor={is_public ? '$primary' : '$background'}
            circular={true}
          >
            <Checkbox.Indicator>
              <Check color={'$black'} />
            </Checkbox.Indicator>
          </Checkbox>
          <Paragraph size={'$5'}>{`${is_public ? 'Public' : 'Private'}`} Profile</Paragraph>
        </XStack>
      </FadeCard>
      <SubmitButton theme="green" borderRadius={'$4'} p={'$4'} onPress={onPress}>
        <Button.Text ff={'$mono'} fontWeight={'500'} tt="uppercase" size={'$5'} color={'$black'}>
          edit profile
        </Button.Text>
      </SubmitButton>
    </YStack>
  )
}

function EditProfileForm({ profile, onSave }: { profile: Tables<'profiles'>; onSave: () => void }) {
  const { id, name, about, is_public } = profile
  const { mutateAsync, error } = useProfileMutation(id)
  const form = useForm<z.infer<typeof ProfileSchema>>()

  const handleSubmit = async () => {
    const values = form.getValues()
    await mutateAsync(values)
    onSave()
  }

  return (
    <SchemaForm
      form={form}
      schema={ProfileSchema}
      props={{
        name: {
          'aria-label': 'Name',
          bc: '$color0',
        },
        about: {
          'aria-label': 'Bio',
          placeholder: 'Tell us about yourself',
          backgroundColor: '$color0',
          rows: 2,
          focusStyle: {
            fontStyle: 'normal',
          },
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
      formProps={{
        $gtSm: {
          maxWidth: '100%',
        },
      }}
      onSubmit={handleSubmit}
      renderAfter={({ submit }) => (
        <YStack>
          <SubmitButton
            theme="green"
            borderRadius={'$4'}
            p={'$4'}
            mt={'$1'}
            onPress={() => submit()}
          >
            <Button.Text
              ff={'$mono'}
              fontWeight={'500'}
              tt="uppercase"
              size={'$5'}
              color={'$black'}
            >
              SAVE CHANGES
            </Button.Text>
          </SubmitButton>
          {error && (
            <Paragraph marginTop={'$3'} theme="red" color="$color9">
              {error.message}
            </Paragraph>
          )}
        </YStack>
      )}
    >
      {({ name, about, isPublic }) => (
        <FadeCard>
          <FieldWithLabel label={'Name'} gap={'$2'}>
            {name}
          </FieldWithLabel>
          <Separator boc={'$silverChalice'} $theme-light={{ boc: '$darkGrayTextField' }} />
          <FieldWithLabel label={'About'} gap={'$2'}>
            {about}
          </FieldWithLabel>
          <Separator boc={'$silverChalice'} $theme-light={{ boc: '$darkGrayTextField' }} />
          <XStack gap={'$3'} ai={'center'}>
            {isPublic}
            <Paragraph size={'$5'}>Make Profile Public</Paragraph>
          </XStack>
        </FadeCard>
      )}
    </SchemaForm>
  )
}
