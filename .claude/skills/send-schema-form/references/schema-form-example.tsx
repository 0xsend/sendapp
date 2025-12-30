import { FadeCard, Paragraph, SubmitButton, YStack } from '@my/ui'
import { SchemaForm, formFields } from 'app/utils/SchemaForm'
import { useForm } from 'react-hook-form'
import { z } from 'zod'

const ExampleSchema = z.object({
  displayName: formFields.text.min(1, 'Display name is required'),
  bio: formFields.textarea.max(160, 'Bio must be 160 characters or less'),
  isPublic: formFields.boolean_switch,
})

type ExampleValues = z.infer<typeof ExampleSchema>

export function ExampleSettingsForm() {
  const form = useForm<ExampleValues>()

  async function handleSubmit(values: ExampleValues) {
    try {
      // Replace with real mutation/API call.
      console.log('submit', values)
    } catch (error) {
      form.setError('displayName', {
        type: 'custom',
        message: error instanceof Error ? error.message : 'Failed to save settings',
      })
    }
  }

  return (
    <SchemaForm
      form={form}
      schema={ExampleSchema}
      defaultValues={{
        displayName: '',
        bio: '',
        isPublic: true,
      }}
      props={{
        displayName: {
          'aria-label': 'Display name',
          placeholder: 'Enter your display name',
          backgroundColor: '$color0',
        },
        bio: {
          'aria-label': 'Bio',
          placeholder: 'Short bio (optional)',
          backgroundColor: '$color0',
          rows: 3,
          focusStyle: { fontStyle: 'normal' },
        },
        isPublic: {
          defaultChecked: true,
        },
      }}
      formProps={{
        footerProps: { p: 0 },
      }}
      onSubmit={handleSubmit}
    >
      {({ displayName, bio, isPublic }) => (
        <YStack gap="$3.5">
          <FadeCard>
            {displayName}
            {bio}
            <YStack gap="$2">
              {isPublic}
              <Paragraph size="$5">Make profile public</Paragraph>
            </YStack>
          </FadeCard>
          <SubmitButton onPress={() => form.handleSubmit(handleSubmit)()}>
            <SubmitButton.Text>Save</SubmitButton.Text>
          </SubmitButton>
        </YStack>
      )}
    </SchemaForm>
  )
}
