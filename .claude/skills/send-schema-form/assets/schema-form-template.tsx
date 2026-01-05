import { SubmitButton, YStack } from '@my/ui'
import { SchemaForm, formFields } from 'app/utils/SchemaForm'
import { useForm } from 'react-hook-form'
import { z } from 'zod'

const ExampleSchema = z.object({
  // TODO: add fields here
  name: formFields.text,
})

type ExampleValues = z.infer<typeof ExampleSchema>

export function ExampleForm() {
  const form = useForm<ExampleValues>()

  async function handleSubmit(values: ExampleValues) {
    // TODO: replace with real submit logic
    console.log('submit', values)
  }

  return (
    <SchemaForm
      form={form}
      schema={ExampleSchema}
      defaultValues={{
        name: '',
      }}
      props={{
        name: {
          'aria-label': 'Name',
          placeholder: 'Enter a name',
        },
      }}
      formProps={{
        footerProps: { p: 0 },
      }}
      onSubmit={handleSubmit}
    >
      {({ name }) => (
        <YStack gap="$3.5">
          {name}
          <SubmitButton onPress={() => form.handleSubmit(handleSubmit)()}>
            <SubmitButton.Text>Save</SubmitButton.Text>
          </SubmitButton>
        </YStack>
      )}
    </SchemaForm>
  )
}
