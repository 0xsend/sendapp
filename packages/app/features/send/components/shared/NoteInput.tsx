import { Input as InputOG, GorhomSheetInput, Paragraph, View } from '@my/ui'
import { Controller, type Control } from 'react-hook-form'
import { MAX_NOTE_LENGTH } from 'app/components/FormFields/NoteField'
import { isWeb } from '@tamagui/constants'

const Input = (isWeb ? InputOG : GorhomSheetInput) as unknown as typeof InputOG

export interface NoteInputProps {
  // biome-ignore lint/suspicious/noExplicitAny: form control types vary
  control: Control<any>
  disabled?: boolean
  placeholder?: string
  error?: { message?: string } | undefined
}

export const NoteInput = ({
  control,
  disabled = false,
  placeholder = 'Add a note...',
  error,
}: NoteInputProps) => {
  return (
    <Controller
      name="note"
      control={control}
      render={({ field: { value, onChange, onBlur, ...rest } }) => (
        <View>
          <Input
            {...rest}
            bg="$aztec5"
            numberOfLines={4}
            ai="flex-start"
            $theme-light={{ bg: '$gray3' }}
            placeholderTextColor="$gray11"
            disabled={disabled}
            pointerEvents={disabled ? 'none' : 'auto'}
            editable={!disabled}
            placeholder={placeholder}
            fos="$5"
            br="$3"
            multiline
            value={value}
            onBlur={onBlur}
            onChangeText={onChange}
            maxLength={MAX_NOTE_LENGTH}
          />
          <Paragraph
            color={error ? '$error' : '$lightGrayTextField'}
            $theme-light={{ color: '$darkGrayTextField' }}
            size="$2"
            pos="absolute"
            b="$2"
            r="$3"
          >
            {error ? error.message : `${value?.length ?? 0}/${MAX_NOTE_LENGTH}`}
          </Paragraph>
        </View>
      )}
    />
  )
}
