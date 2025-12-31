import { memo } from 'react'
import { Platform } from 'react-native'
import { Button, Input, ThemeableStack, XStack, type XStackProps } from '@my/ui'
import { useThemeName } from 'tamagui'
import { IconSearch, IconX } from 'app/components/icons'
import { useContactBook } from '../ContactBookProvider'

/**
 * Props for ContactSearchBar component.
 */
export interface ContactSearchBarProps extends Omit<XStackProps, 'children'> {
  /** Placeholder text for the input */
  placeholder?: string
  /** Whether to auto-focus the input */
  autoFocus?: boolean
}

/**
 * ContactSearchBar provides a search input for filtering contacts.
 *
 * Features:
 * - Debounced input (handled by ContactBookProvider)
 * - Clear button when text is present
 * - Styled consistently with the app's search UI
 * - Uses ContactBookProvider context for state
 *
 * @example
 * ```tsx
 * <ContactBookProvider>
 *   <ContactSearchBar placeholder="Search contacts..." />
 *   <ContactList />
 * </ContactBookProvider>
 * ```
 */
export const ContactSearchBar = memo(function ContactSearchBar({
  placeholder = 'Search contacts',
  autoFocus = false,
  ...containerProps
}: ContactSearchBarProps) {
  const { query, setQuery, clearSearch } = useContactBook()
  const theme = useThemeName()
  const borderColor = theme?.startsWith('dark') ? '$primary' : '$color12'

  const handleTextChange = (text: string) => {
    // Allow all characters for searching - server handles sanitization
    setQuery(text)
  }

  const handleClear = () => {
    clearSearch()
  }

  return (
    <XStack
      position="relative"
      testID="contactSearchContainer"
      bc="transparent"
      br="$4"
      {...containerProps}
    >
      <ThemeableStack
        elevation="$0.75"
        shadowOpacity={0.3}
        $platform-native={{ elevation: '$0.25', shadowOpacity: 0.05 }}
        br="$4"
        w="100%"
      >
        <Input
          testID="contactSearchInput"
          value={query}
          onChangeText={handleTextChange}
          placeholder={placeholder}
          placeholderTextColor="$color4"
          accessibilityRole="search"
          accessibilityLabel="Search contacts"
          fontWeight="normal"
          br="$4"
          pr="$3.5"
          pl="$8"
          fontSize={17}
          lineHeight={20}
          {...(Platform.OS === 'web' ? { py: '$5' } : {})}
          focusStyle={{
            outlineWidth: 2,
            outlineColor: borderColor,
          }}
          $theme-light={{
            focusStyle: {
              outlineWidth: 2,
              outlineColor: '$gray7',
            },
          }}
          autoFocus={autoFocus}
        />

        {/* Search icon (left) */}
        <XStack
          position="absolute"
          left={0}
          top={0}
          bottom={0}
          ai="center"
          jc="center"
          pl="$3"
          pointerEvents="none"
        >
          <IconSearch
            color="$silverChalice"
            $theme-light={{ color: '$darkGrayTextField' }}
            size="$1"
          />
        </XStack>

        {/* Clear button (right) */}
        {query.length > 0 && (
          <XStack position="absolute" right={0} top={0} bottom={0} ai="center" jc="center" pr="$2">
            <Button
              testID="contactSearchClear"
              chromeless
              unstyled
              cursor="pointer"
              p="$2"
              onPress={handleClear}
              accessibilityLabel="Clear search"
              accessibilityRole="button"
            >
              <IconX
                color="$silverChalice"
                $theme-light={{ color: '$darkGrayTextField' }}
                size="$1"
              />
            </Button>
          </XStack>
        )}
      </ThemeableStack>
    </XStack>
  )
})

export default ContactSearchBar
