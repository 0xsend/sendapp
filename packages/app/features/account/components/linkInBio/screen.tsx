import {
  FadeCard,
  Paragraph,
  SubmitButton,
  Text,
  YStack,
  XStack,
  Input,
  Spinner,
  useMedia,
} from '@my/ui'
import { useCallback, useEffect, useState } from 'react'
import { FormProvider, useForm } from 'react-hook-form'
import { SettingsHeader } from 'app/features/account/components/SettingsHeader'
import { Platform } from 'react-native'
import {
  LinkInBioDomainNamesEnum,
  useLinkInBioMutation,
  type LinkInBioFormData,
} from 'app/utils/useLinkInBioMutation'
import { useUser } from 'app/utils/useUser'
import { IconLinkInBio } from 'app/components/icons'
import type { Database } from '@my/supabase/database-generated.types'

type LinkInBioDomainName = Database['public']['Enums']['link_in_bio_domain_names']

enum FormState {
  Overview = 'Overview',
  LinkInBioForm = 'LinkInBioForm',
}

export const LinkInBioScreen = () => {
  const media = useMedia()
  const { linksInBio, isLoading } = useUser()
  const form = useForm<LinkInBioFormData>()
  const { mutateAsync: updateLinkInBio } = useLinkInBioMutation()
  const [formState, setFormState] = useState<FormState>(FormState.Overview)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [domainHandles, setDomainHandles] = useState<Record<LinkInBioDomainName, string>>(
    {} as Record<LinkInBioDomainName, string>
  )

  const handleSubmit = useCallback(async () => {
    setErrorMessage(null)

    try {
      // Convert domain handles to LinkInBioFormData format
      const linkInBioData: LinkInBioFormData = Object.entries(domainHandles || {}).map(
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
  }, [domainHandles, updateLinkInBio])

  useEffect(() => {
    if (linksInBio && Array.isArray(linksInBio)) {
      const handles: Record<LinkInBioDomainName, string> = {} as Record<LinkInBioDomainName, string>
      for (const link of linksInBio) {
        handles[link.domain_name] = link.handle ?? ''
      }
      setDomainHandles(handles)
    }
  }, [linksInBio])

  const updateDomainHandle = useCallback((domain_name: string, handle: string) => {
    setDomainHandles((prev) => ({
      ...prev,
      [domain_name]: handle,
    }))
  }, [])

  const renderAfterContent = useCallback(
    ({ submit }: { submit: () => void }) => (
      <YStack>
        <SubmitButton onPress={() => submit()}>
          <SubmitButton.Text>SAVE CHANGES</SubmitButton.Text>
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
        {errorMessage && (
          <Paragraph marginBottom={'$5'} theme="red" color="$color9">
            {errorMessage}
          </Paragraph>
        )}
        <YStack gap={'$4'}>
          {Object.values(LinkInBioDomainNamesEnum).map((domain_name) => {
            const currentHandle = domainHandles[domain_name] || ''

            return (
              <YStack key={domain_name} gap={'$2'}>
                <XStack gap={'$4'} alignItems="center">
                  <IconLinkInBio domain_name={domain_name} />
                  <YStack flex={1} bbc={'$color12'}>
                    <Input
                      placeholder={domain_name}
                      placeholderTextColor={'$color10'}
                      value={currentHandle}
                      onChangeText={(value) => updateDomainHandle(domain_name, value)}
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
        {linksInBio && Array.isArray(linksInBio) && linksInBio.length > 0 ? (
          linksInBio.map(({ domain, handle, domain_name }, index) => {
            return (
              <YStack key={domain || `${domain_name}-${index}`}>
                <XStack gap={'$5'} ai="center">
                  <IconLinkInBio domain_name={domain_name} />
                  <Paragraph size={media.gtXs ? '$6' : '$4'} color={'$color12'}>
                    {`${domain}${handle ?? ''}`}
                  </Paragraph>
                </XStack>
              </YStack>
            )
          })
        ) : (
          <Text>No social links added yet.</Text>
        )}
      </FadeCard>
      <SubmitButton onPress={() => setFormState(FormState.LinkInBioForm)}>
        <SubmitButton.Text>edit links</SubmitButton.Text>
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
