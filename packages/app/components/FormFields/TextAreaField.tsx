import { useThemeSetting } from '@tamagui/next-theme'
import { useStringFieldInfo, useTsController } from '@ts-react/form'
import { useId } from 'react'
import {
  Fieldset,
  Label,
  TextArea,
  type TextAreaProps,
  Theme,
  type ThemeName,
  useThemeName,
  FieldError,
  Shake,
} from '@my/ui'

export const TextAreaField = (
  props: Pick<
    TextAreaProps,
    'size' | 'autoFocus' | 'accessibilityLabel' | 'placeholder' | 'fontStyle'
  >
) => {
  const {
    field,
    error,
    formState: { isSubmitting },
  } = useTsController<string>()
  const { label, isOptional, placeholder } = useStringFieldInfo()
  const id = useId()
  const disabled = isSubmitting
  const defaultTheme = useThemeName() as string
  const { resolvedTheme } = useThemeSetting()
  const themeName = (resolvedTheme ?? defaultTheme) as ThemeName

  return (
    <Theme name={error ? 'red' : themeName} forceClassName>
      <Fieldset>
        {!!label && (
          <Label
            size={props.size || '$5'}
            fontFamily={'$mono'}
            lineHeight={52}
            htmlFor={id}
            textTransform={'uppercase'}
            color="$olive"
          >
            {label} {isOptional && '(Optional)'}
          </Label>
        )}
        <Shake shakeKey={error?.errorMessage}>
          <TextArea
            disabled={disabled}
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
            value={field.value}
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
