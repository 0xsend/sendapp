import { useThemeSetting } from '@tamagui/next-theme'
import { useStringFieldInfo, useTsController } from '@ts-react/form'
import { forwardRef, type ReactNode, useId } from 'react'
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
  Stack,
  useComposedRefs,
  type TamaguiElement,
} from '@my/ui'

export const TextAreaField = forwardRef<
  TamaguiElement,
  TextAreaProps & { labelProps?: LabelProps; iconBefore?: ReactNode; iconAfter?: ReactNode }
>((props, forwardedRef) => {
  const {
    field,
    error,
    formState: { isSubmitting },
  } = useTsController<string>()
  const { label, placeholder } = useStringFieldInfo()
  const id = useId()
  const disabled = isSubmitting
  const defaultTheme = useThemeName() as string
  const { resolvedTheme } = useThemeSetting()
  const themeName = (resolvedTheme ?? defaultTheme) as ThemeName
  const composedRefs = useComposedRefs(forwardedRef, field.ref)

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
            {label}
          </Label>
        )}
        <Shake shakeKey={error?.errorMessage}>
          {props.iconBefore && (
            <Stack
              pos={'absolute'}
              top="50%"
              p={'$3'}
              left={2}
              transform={'translateY(-50%)'}
              zIndex={1}
            >
              {props.iconBefore}
            </Stack>
          )}
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
            ref={composedRefs}
            placeholder={placeholder}
            id={id}
            focusStyle={{
              fontStyle: 'italic',
              borderColor: '$color12',
            }}
            {...props}
          />
          {props.iconAfter && (
            <Stack
              pos={'absolute'}
              top="50%"
              p={'$5'}
              right={2}
              transform={'translateY(-50%)'}
              zIndex={1}
            >
              {props.iconAfter}
            </Stack>
          )}
        </Shake>
        <FieldError message={error?.errorMessage} />
      </Fieldset>
    </Theme>
  )
})

TextAreaField.displayName = 'TextAreaField'
