import {
  FieldError,
  Fieldset,
  Label,
  type LabelProps,
  Shake,
  Stack,
  TextArea,
  type TextAreaProps,
  Theme,
  type ThemeName,
  useThemeName,
} from '@my/ui'
import { useThemeSetting } from '@tamagui/next-theme'
import { useStringFieldInfo, useTsController } from '@ts-react/form'
import { type ReactNode, useId } from 'react'

export const TextAreaField = (
  props: TextAreaProps & { labelProps?: LabelProps; iconBefore?: ReactNode; iconAfter?: ReactNode }
) => {
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
          <Stack pos="relative">
            {props.iconBefore && (
              <Stack
                pos={'absolute'}
                top={0}
                bottom={0}
                left={0}
                right={0}
                justifyContent="center"
                zIndex={1}
                pointerEvents="box-none"
              >
                {props.iconBefore}
              </Stack>
            )}
            <TextArea
              disabled={disabled}
              width={'100%'}
              borderWidth={0}
              borderRadius={'$4'}
              $theme-dark={{
                // placeholderTextColor fails in test env for some reason
                ...(process.env.NODE_ENV !== 'test' ? { placeholderTextColor: '$gray10Dark' } : {}),
              }}
              $theme-light={{
                // placeholderTextColor fails in test env for some reason
                ...(process.env.NODE_ENV !== 'test'
                  ? { placeholderTextColor: '$gray10Light' }
                  : {}),
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
            {props.iconAfter && (
              <Stack
                pos={'absolute'}
                top={0}
                bottom={0}
                left={0}
                right={0}
                justifyContent="center"
                alignItems={'flex-end'}
                zIndex={1}
                pointerEvents="box-none" // Prevent blocking interactions
              >
                {props.iconAfter}
              </Stack>
            )}
          </Stack>
        </Shake>
        <FieldError message={error?.errorMessage} />
      </Fieldset>
    </Theme>
  )
}
