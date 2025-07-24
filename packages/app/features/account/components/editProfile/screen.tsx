import {
  Card,
  Checkbox,
  Fade,
  FadeCard,
  Image,
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
import { UploadBanner, type UploadBannerRefObject } from '../UploadProfileBanner'
import { useCallback, useRef, useState } from 'react'
import type { Tables } from '@my/supabase/database.types'
import { Check } from '@tamagui/lucide-icons'
import { SettingsHeader } from 'app/features/account/components/SettingsHeader'
import { ReadOnlyFieldWithLabel } from 'app/features/account/components/ReadOnlyFieldWithLabel'
import { FieldWithLabel } from 'app/features/account/components/FieldWithLabel'
import { useForm } from 'react-hook-form'
import type { z } from 'zod'
import { Platform } from 'react-native'

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
        {Platform.OS === 'web' && <SettingsHeader>Profile</SettingsHeader>}
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
  const { name, about, is_public, avatar_url, banner_url } = profile
  const avatarRef = useRef<UploadAvatarRefObject>(null)
  const bannerRef = useRef<UploadBannerRefObject>(null)

  return (
    <YStack gap={'$5'}>
      <Fade>
        <Card padded size={'$4.5'} gap={'$3.5'} br={'$5'}>
          <YStack w="100%" position="relative" mb="$4">
            <UploadBanner ref={bannerRef} w="100%">
              <YStack
                w="100%"
                aspectRatio={21 / 9}
                backgroundColor="$color2"
                borderRadius="$3"
                jc="center"
                ai="center"
                overflow="hidden"
              >
                {banner_url ? (
                  <Image
                    source={{ uri: banner_url }}
                    w="100%"
                    h="100%"
                    borderRadius="$3"
                    objectFit="cover"
                  />
                ) : null}
              </YStack>
            </UploadBanner>
            <YStack
              position="absolute"
              bottom={-30}
              left={16}
              zIndex={10}
              bw="$1.5"
              boc={'$color1'}
              br="$4"
            >
              <UploadAvatar ref={avatarRef}>
                <ProfileAvatar
                  avatarUrl={avatar_url ? avatar_url : undefined}
                  $gtMd={{ size: 88 }}
                  size={88}
                />
              </UploadAvatar>
            </YStack>
          </YStack>
          <FieldWithLabel label={'Name'} mt="$4">
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
        </Card>
      </Fade>
      <SubmitButton onPress={onPress}>
        <SubmitButton.Text>edit profile</SubmitButton.Text>
      </SubmitButton>
    </YStack>
  )
}

function EditProfileForm({ profile, onSave }: { profile: Tables<'profiles'>; onSave: () => void }) {
  const { id, name, about, is_public } = profile
  const { mutateAsync, error } = useProfileMutation(id)
  const form = useForm<z.infer<typeof ProfileSchema>>()

  const renderAfterContent = useCallback(
    ({ submit }: { submit: () => void }) => (
      <YStack>
        <SubmitButton onPress={() => submit()}>
          <SubmitButton.Text>SAVE CHANGES</SubmitButton.Text>
        </SubmitButton>
        {error && (
          <Paragraph marginTop={'$3'} theme="red" color="$color9">
            {error.message}
          </Paragraph>
        )}
      </YStack>
    ),
    [error]
  )

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
        footerProps: { p: 0 },
        $gtSm: {
          maxWidth: '100%',
        },
      }}
      onSubmit={handleSubmit}
      renderAfter={renderAfterContent}
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
