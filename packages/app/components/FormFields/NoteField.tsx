import { useThemeSetting } from '@tamagui/next-theme'
import { useStringFieldInfo, useTsController } from '@ts-react/form'
import { forwardRef, type ReactNode, useEffect, useId, useRef, useState } from 'react'
import {
  FieldError,
  Fieldset,
  isWeb,
  Label,
  type LabelProps,
  Shake,
  type StackProps,
  type TamaguiElement,
  TextArea,
  type TextAreaProps,
  Theme,
  type ThemeName,
  useComposedRefs,
  useThemeName,
} from '@my/ui'
import { Platform } from 'react-native'
import IconBefore from './IconBefore/IconBefore'
import IconAfter from './IconAfter/IconAfter'

export const MAX_NOTE_LENGTH = 100
const MIN_NOTE_ROWS = 1
const MAX_NOTE_ROWS = 4
const LINE_HEIGHT = 24
const BASE_NOTE_HEIGHT = 60 // For web
const NATIVE_MIN_HEIGHT = 56 // Minimal height for native (single line with proper padding)
const NATIVE_LINE_HEIGHT = 20 // native-specific line height

function adjustNoteFieldHeightForWeb(noteField: HTMLTextAreaElement) {
  noteField.rows = MIN_NOTE_ROWS
  const rows = Math.ceil((noteField.scrollHeight - BASE_NOTE_HEIGHT) / LINE_HEIGHT)
  noteField.rows = Math.min(MAX_NOTE_ROWS, MIN_NOTE_ROWS + rows)
}

function calculateNativeHeight(contentHeight: number): number {
  // Use content height directly, but ensure minimum and cap at maximum
  const maxHeight = MAX_NOTE_ROWS * NATIVE_LINE_HEIGHT + 16 // Padding for 4 lines
  return Math.max(NATIVE_MIN_HEIGHT, Math.min(contentHeight, maxHeight))
}

export const NoteField = forwardRef<
  TamaguiElement,
  TextAreaProps & {
    labelProps?: LabelProps
    iconBefore?: ReactNode
    iconAfter?: ReactNode
    iconBeforeProps?: StackProps
    iconAfterProps?: StackProps
  }
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

  // native-specific height management
  const [nativeHeight, setNativeHeight] = useState<number>(NATIVE_MIN_HEIGHT)

  useEffect(() => {
    if (ref.current && isWeb && field.value !== undefined) {
      const textAreaElement = ref.current as unknown as HTMLTextAreaElement

      if (textAreaElement.value !== field.value) {
        textAreaElement.value = field.value
      }

      adjustNoteFieldHeightForWeb(textAreaElement)
    }
  }, [field.value])

  // Reset native height when field is cleared
  useEffect(() => {
    if (Platform.OS !== 'web' && (!field.value || field.value.trim().length === 0)) {
      setNativeHeight(NATIVE_MIN_HEIGHT)
    }
  }, [field.value])

  const handleNativeContentSizeChange = (event: {
    nativeEvent: { contentSize: { height: number } }
  }) => {
    if (Platform.OS !== 'web' && field.value) {
      const newHeight = calculateNativeHeight(event.nativeEvent.contentSize.height)
      setNativeHeight(newHeight)
    }
  }

  // Separate native-specific props to override passed props
  const nativeSpecificProps =
    Platform.OS !== 'web'
      ? {
          multiline: true,
          textAlignVertical: 'top' as const,
          height: nativeHeight,
          minHeight: nativeHeight, // Override any minHeight passed from parent
          maxHeight: MAX_NOTE_ROWS * NATIVE_LINE_HEIGHT + 16,
          onContentSizeChange: handleNativeContentSizeChange,
          // Ensure proper flex behavior on native
          flex: undefined, // Remove flex to prevent layout conflicts
          alignSelf: 'stretch' as const, // Ensure full width
        }
      : {}

  // Web-specific props (maintain existing behavior)
  const webSpecificProps = isWeb
    ? {
        multiline: true,
      }
    : {}

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
            <IconBefore {...props.iconBeforeProps}>{props.iconBefore}</IconBefore>
          )}
          <TextArea
            disabled={disabled}
            borderWidth={0}
            borderRadius={'$4'}
            placeholderTextColor={'$color4'}
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
            // Apply passed props first
            {...props}
            // Then override with platform-specific props (these take precedence)
            {...webSpecificProps}
            {...nativeSpecificProps}
          />
          {props.iconAfter && <IconAfter {...props.iconAfterProps}>{props.iconAfter}</IconAfter>}
        </Shake>
        <FieldError message={error?.errorMessage} />
      </Fieldset>
    </Theme>
  )
})

NoteField.displayName = 'NoteField'
