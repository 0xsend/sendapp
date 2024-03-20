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
  return (
    <Theme name={error ? 'red' : themeName} forceClassName>
      {/* flex 1 is needed to make the input fill the width of the parent in the case of a being in a container with flex direction row */}
      <Fieldset f={1}>
        {!!label && (
          <Label
            size={props.size || '$5'}
            // $mono font is broken in tests
            fontFamily={'$mono'}
            lineHeight={'$11'}
            htmlFor={id}
            textTransform={'uppercase'}
            color="$olive"
          >
            {label} {isOptional && '(Optional)'}
          </Label>
        )}
        <Shake shakeKey={error?.errorMessage}>
          <Input
            accessibilityLabel={label}
            disabled={disabled}
            maxLength={maxLength}
            borderWidth={0}
            borderRadius={'$4'}
            $theme-dark={{
              bc: '$charcoal',
              color: '$gray12Dark',
              // placeholderTextColor fails in test env for some reason
              ...(process.env.NODE_ENV !== 'test' ? { placeholderTextColor: '$gray10Dark' } : {}),
            }}
            $theme-light={{
              bc: '$gray3Light',
              color: '$gray12Light',
              // placeholderTextColor fails in test env for some reason
              ...(process.env.NODE_ENV !== 'test' ? { placeholderTextColor: '$gray10Light' } : {}),
            }}
            // @todo use the theme colors if we ever have the palette scales
            // bc={'$color2'}
            // color={'$color12'}
            // placeholderTextColor={'$color10'}
            spellCheck={isEmail ? false : undefined}
            autoCapitalize={isEmail ? 'none' : undefined}
            keyboardType={isEmail ? 'email-address' : undefined}
            value={field.value ?? ''}
            onChangeText={(text) => field.onChange(text)}
            onBlur={field.onBlur}
            ref={field.ref}
            placeholder={placeholder}
            id={id}
            focusStyle={{
              fontStyle: 'italic',
              borderColor: '$color12',
            }}
            {...props}
          />
        </Shake>
        <FieldError message={error?.errorMessage} />
      </Fieldset>
    </Theme>
  )
}
