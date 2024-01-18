import { useThemeSetting } from '@tamagui/next-theme'
import { useStringFieldInfo, useTsController } from '@ts-react/form'
import { useId } from 'react'
import { Fieldset, Input, InputProps, Label, Theme, useThemeName } from 'tamagui'
import { FieldError } from '../FieldError'
import { Shake } from '../Shake'

export const TextField = (props: InputProps) => {
  const {
    field,
    error,
    formState: { isSubmitting },
  } = useTsController<string>()
  const { label, placeholder, isOptional, maxLength, isEmail } = useStringFieldInfo()
  const themeName = useThemeName()
  const id = useId()
  const disabled = isSubmitting
  const { resolvedTheme } = useThemeSetting()

  return (
    <Theme name={error ? 'red' : themeName} forceClassName>
      {/* flex 1 is needed to make the input fill the width of the parent in the case of a being in a container with flex direction row */}
      <Fieldset f={1}>
        {!!label && (
          <Label size={props.size || '$3'} htmlFor={id}>
            {label} {isOptional && '(Optional)'}
          </Label>
        )}
        <Shake shakeKey={error?.errorMessage}>
          <Input
            color={resolvedTheme?.startsWith('dark') ? 'white' : 'black'}
            disabled={disabled}
            maxLength={maxLength}
            placeholderTextColor="$color10"
            spellCheck={isEmail ? false : undefined}
            autoCapitalize={isEmail ? 'none' : undefined}
            keyboardType={isEmail ? 'email-address' : undefined}
            value={field.value ?? ''}
            onChangeText={(text) => field.onChange(text)}
            onBlur={field.onBlur}
            ref={field.ref}
            placeholder={placeholder}
            id={id}
            backgroundColor={resolvedTheme?.startsWith('dark') ? 'black' : 'white'}
            {...props}
          />
        </Shake>
        <FieldError message={error?.errorMessage} />
      </Fieldset>
    </Theme>
  )
}
