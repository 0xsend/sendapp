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
  type LabelProps,
} from '@my/ui'

export const TextAreaField = (
  props: Pick<
    TextAreaProps,
    'size' | 'autoFocus' | 'aria-label' | 'placeholder' | 'fontStyle' | 'backgroundColor' | 'rows'
  > & { labelProps?: LabelProps }
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
            htmlFor={id}
            fontFamily={props.labelProps?.fontFamily ?? '$mono'}
            lineHeight={props.labelProps?.lineHeight ?? 52}
            textTransform={props.labelProps?.textTransform ?? 'uppercase'}
            color={props.labelProps?.color ?? '$olive'}
            {...props.labelProps}
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
              // placeholderTextColor fails in test env for some reason
              ...(process.env.NODE_ENV !== 'test' ? { placeholderTextColor: '$gray10Dark' } : {}),
            }}
            $theme-light={{
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
