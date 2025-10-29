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
const ANDROID_MIN_HEIGHT = 56 // Minimal height for Android (single line with proper padding)
const ANDROID_LINE_HEIGHT = 20 // Android-specific line height

function adjustNoteFieldHeightForWeb(noteField: HTMLTextAreaElement) {
  noteField.rows = MIN_NOTE_ROWS
  const rows = Math.ceil((noteField.scrollHeight - BASE_NOTE_HEIGHT) / LINE_HEIGHT)
  noteField.rows = Math.min(MAX_NOTE_ROWS, MIN_NOTE_ROWS + rows)
}

function calculateAndroidHeight(contentHeight: number): number {
  // Use content height directly, but ensure minimum and cap at maximum
  const maxHeight = MAX_NOTE_ROWS * ANDROID_LINE_HEIGHT + 16 // Padding for 4 lines
  return Math.max(ANDROID_MIN_HEIGHT, Math.min(contentHeight, maxHeight))
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

  // Android-specific height management
  const [androidHeight, setAndroidHeight] = useState<number>(ANDROID_MIN_HEIGHT)

  useEffect(() => {
    if (ref.current && isWeb && field.value !== undefined) {
      const textAreaElement = ref.current as unknown as HTMLTextAreaElement

      if (textAreaElement.value !== field.value) {
        textAreaElement.value = field.value
      }

      adjustNoteFieldHeightForWeb(textAreaElement)
    }
  }, [field.value])

  // Reset Android height when field is cleared
  useEffect(() => {
    if (Platform.OS === 'android' && (!field.value || field.value.trim().length === 0)) {
      setAndroidHeight(ANDROID_MIN_HEIGHT)
    }
  }, [field.value])

  const handleAndroidContentSizeChange = (event: {
    nativeEvent: { contentSize: { height: number } }
  }) => {
    if (Platform.OS === 'android' && field.value) {
      const newHeight = calculateAndroidHeight(event.nativeEvent.contentSize.height)
      setAndroidHeight(newHeight)
    }
  }

  // Separate Android-specific props to override passed props
  const androidSpecificProps =
    Platform.OS === 'android'
      ? {
          multiline: true,
          textAlignVertical: 'top' as const,
          height: androidHeight,
          minHeight: androidHeight, // Override any minHeight passed from parent
          maxHeight: MAX_NOTE_ROWS * ANDROID_LINE_HEIGHT + 16,
          onContentSizeChange: handleAndroidContentSizeChange,
          // Ensure proper flex behavior on Android
          flex: undefined, // Remove flex to prevent layout conflicts
          alignSelf: 'stretch' as const, // Ensure full width
        }
      : {}

  // iOS-specific props (maintain existing behavior)
  const iosSpecificProps =
    Platform.OS === 'ios'
      ? {
          multiline: true,
          textAlignVertical: 'top' as const,
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
            {...iosSpecificProps}
            {...androidSpecificProps}
          />
          {props.iconAfter && <IconAfter {...props.iconAfterProps}>{props.iconAfter}</IconAfter>}
        </Shake>
        <FieldError message={error?.errorMessage} />
      </Fieldset>
    </Theme>
  )
})

NoteField.displayName = 'NoteField'
