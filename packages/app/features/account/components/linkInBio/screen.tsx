import {
  Button,
  FadeCard,
  Paragraph,
  SubmitButton,
  Text,
  YStack,
  XStack,
  Input,
  Spinner,
} from '@my/ui'
import { useCallback, useEffect, useState } from 'react'
import { FormProvider, useForm } from 'react-hook-form'
import { SettingsHeader } from 'app/features/account/components/SettingsHeader'
import { Platform } from 'react-native'
import { useLinkInBioMutation, type LinkInBioFormData } from 'app/utils/useLinkInBioMutation'
import { useUser } from 'app/utils/useUser'
import { IconSocial } from 'app/components/icons'
import { type LinkInBioDomainName, LinkInBioDomainNamesEnum } from 'app/utils/zod/LinkInBioSchema'
import { socialToColors } from 'app/components/icons/IconSocial'

enum FormState {
  Overview = 'Overview',
  LinkInBioForm = 'LinkInBioForm',
}

export const LinkInBioScreen = () => {
  const { linkInBio, isLoading } = useUser()
  const form = useForm<LinkInBioFormData>()
  const { mutateAsync: updateLinkInBio } = useLinkInBioMutation()
  const [formState, setFormState] = useState<FormState>(FormState.Overview)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [platformHandles, setPlatformHandles] = useState<Record<LinkInBioDomainName, string>>(
    {} as Record<LinkInBioDomainName, string>
  )

  const handleSubmit = useCallback(async () => {
    setErrorMessage(null)

    try {
      // Convert platform handles to SocialLinksFormData format
      const linkInBioData: LinkInBioFormData = Object.entries(platformHandles || {}).map(
        ([domain_name, handle]) => ({
          domain_name: domain_name as LinkInBioDomainName,
          handle: handle.trim(),
        })
      )

      await updateLinkInBio(linkInBioData)
      setFormState(FormState.Overview)
    } catch (error) {
      console.error(error)
      if (error?.message) {
        setErrorMessage(error.message)
      }
    }
  }, [platformHandles, updateLinkInBio])

  useEffect(() => {
    if (linkInBio) {
      const handles: Record<string, string> = {}
      for (const link of linkInBio) {
        handles[link.domain_name] = link.handle ?? ''
      }
      setPlatformHandles(handles)
    }
  }, [linkInBio])

  const updatePlatformHandle = useCallback((domain_name: string, handle: string) => {
    setPlatformHandles((prev) => ({
      ...prev,
      [domain_name]: handle,
    }))
  }, [])

  const renderAfterContent = useCallback(
    ({ submit }: { submit: () => void }) => (
      <YStack>
        <SubmitButton
          elevation={'$0.75'}
          theme="green"
          borderRadius={'$4'}
          p={'$4'}
          mt={'$1'}
          onPress={() => submit()}
        >
          <Button.Text ff={'$mono'} fontWeight={'500'} tt="uppercase" size={'$5'} color={'$black'}>
            SAVE CHANGES
          </Button.Text>
        </SubmitButton>
        {errorMessage && (
          <Paragraph marginTop={'$5'} theme="red" color="$color9">
            {errorMessage}
          </Paragraph>
        )}
      </YStack>
    ),
    [errorMessage]
  )

  const socialLinksForm = (
    <YStack gap={'$5'}>
      <FadeCard elevation={'$0.75'}>
        <YStack gap={'$4'}>
          {LinkInBioDomainNamesEnum.options.map((platform) => {
            const currentHandle = platformHandles[platform] || ''

            return (
              <YStack key={platform} gap={'$2'}>
                <XStack gap={'$4'} alignItems="center">
                  <YStack p="$2" br="$2" bc={socialToColors[platform]} ai="center" jc="center">
                    <IconSocial domain_name={platform} size={'$2'} color={'$white'} />
                  </YStack>
                  <YStack flex={1} bbc={'$color12'}>
                    <Input
                      placeholder={platform}
                      placeholderTextColor={'$color10'}
                      value={currentHandle}
                      onChangeText={(value) => updatePlatformHandle(platform, value)}
                      autoCapitalize="none"
                      autoCorrect={false}
                      bc={'$color0'}
                    />
                  </YStack>
                </XStack>
              </YStack>
            )
          })}
        </YStack>
      </FadeCard>
      {renderAfterContent({ submit: handleSubmit })}
    </YStack>
  )

  const overview = (
    <YStack gap={'$5'}>
      <FadeCard>
        {linkInBio?.length ? (
          linkInBio.map(({ domain, handle, domain_name }) => {
            return (
              <YStack key={domain}>
                <XStack gap={'$3'} alignItems="center">
                  <IconSocial domain_name={domain_name} size={'$2'} color={'$color10'} />
                  <YStack flex={1}>
                    <Paragraph size={'$5'} color={'$color12'}>
                      {handle ?? ''}
                    </Paragraph>
                  </YStack>
                </XStack>
              </YStack>
            )
          })
        ) : (
          <Text>No social links added yet.</Text>
        )}
      </FadeCard>
      <SubmitButton
        theme="green"
        borderRadius={'$4'}
        p={'$4'}
        onPress={() => setFormState(FormState.LinkInBioForm)}
      >
        <Button.Text ff={'$mono'} fontWeight={'500'} tt="uppercase" size={'$5'} color={'$black'}>
          edit social links
        </Button.Text>
      </SubmitButton>
    </YStack>
  )

  if (isLoading) {
    return <Spinner size="small" color="$color12" />
  }

  return (
    <YStack w={'100%'}>
      <YStack gap={'$3.5'}>
        {Platform.OS === 'web' && <SettingsHeader>Link In Bio</SettingsHeader>}
        <FormProvider {...form}>
          {(() => {
            switch (formState) {
              case FormState.Overview:
                return overview
              case FormState.LinkInBioForm:
                return socialLinksForm
              default:
                return overview
            }
          })()}
        </FormProvider>
      </YStack>
    </YStack>
  )
}
