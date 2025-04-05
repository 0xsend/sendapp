import { useThemeSetting } from '@tamagui/next-theme'
import { useStringFieldInfo, useTsController } from '@ts-react/form'
import { forwardRef, type ReactNode, useEffect, useId, useRef } from 'react'
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
  isWeb,
} from '@my/ui'

export const MAX_NOTE_LENGTH = 100
const MIN_NOTE_ROWS = 1
const MAX_NOTE_ROWS = 4
const LINE_HEIGHT = 24
const BASE_NOTE_HEIGHT = 60

function adjustNoteFieldHeightForWeb(noteField: HTMLTextAreaElement) {
  noteField.rows = MIN_NOTE_ROWS
  const rows = Math.ceil((noteField.scrollHeight - BASE_NOTE_HEIGHT) / LINE_HEIGHT)
  noteField.rows = Math.min(MAX_NOTE_ROWS, MIN_NOTE_ROWS + rows)
}

export const NoteField = forwardRef<
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
  const ref = useRef<TamaguiElement>(null)
  const composedRefs = useComposedRefs<TamaguiElement>(forwardedRef, field.ref, ref)

  useEffect(() => {
    if (ref.current && isWeb && field.value !== undefined) {
      const textAreaElement = ref.current as unknown as HTMLTextAreaElement

      if (textAreaElement.value !== field.value) {
        textAreaElement.value = field.value
      }

      adjustNoteFieldHeightForWeb(textAreaElement)
    }
  }, [field.value])

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
            // @ts-expect-error Tamagui no have TextArea
            ref={composedRefs}
            placeholder={placeholder ?? 'Add a note'}
            id={id}
            boc={error ? '$error' : '$color1'}
            focusStyle={{
              fontStyle: 'italic',
              borderColor: '$color12',
            }}
            bw={1}
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

NoteField.displayName = 'NoteField'
