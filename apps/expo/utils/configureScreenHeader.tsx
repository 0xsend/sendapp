import { Button, H4, View, XStack } from '@my/ui'
import { Plus } from '@tamagui/lucide-icons'
import type React from 'react'
import { DrawerToggleButton } from '@react-navigation/drawer'
import type { NativeStackNavigationOptions } from '@react-navigation/native-stack'

interface MenuButtonProps {
  color?: string
}

// Menu button component for drawer toggle
export const MenuButton = ({ color = '$color12' }: MenuButtonProps) => {
  return <DrawerToggleButton tintColor={color} />
}

interface ConfigureScreenHeaderOptions {
  title: string
  showBack?: boolean
  showMenu?: boolean
  showAction?: boolean
  actionIcon?: React.ReactNode
  onActionPress?: () => void
}

/**
 * Utility function to configure consistent screen headers across the app
 *
 * @param options Configuration options for the header
 * @returns Header configuration object for React Navigation
 */
export function configureScreenHeader(
  options: ConfigureScreenHeaderOptions
): NativeStackNavigationOptions {
  return {
    title: options.title,
    headerTitle: () => (
      <XStack alignItems="center" justifyContent="center">
        <H4>{options.title}</H4>
      </XStack>
    ),
    headerShown: true,
    headerShadowVisible: false,
    headerTitleAlign: 'center' as const, // Specifically typed as "center" literal
    headerLeft: options.showMenu
      ? () => <MenuButton />
      : options.showBack
        ? undefined // Use default back button
        : () => <View />,
    headerRight: options.showAction
      ? () => (
          <Button borderStyle="unset" backgroundColor="transparent" onPress={options.onActionPress}>
            {options.actionIcon || <Plus size={24} />}
          </Button>
        )
      : () => <View />,
  }
}
