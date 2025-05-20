import { Button, H4, View, XStack } from '@my/ui'
import { Plus } from '@tamagui/lucide-icons'
import type React from 'react'
import { DrawerToggleButton } from '@react-navigation/drawer'
import type { NativeStackNavigationOptions } from '@react-navigation/native-stack'
import type { ComponentType } from 'react'

interface MenuButtonProps {
  color?: string
}

// Menu button component for drawer toggle
export const MenuButton = ({ color = '$color12' }: MenuButtonProps) => {
  return <DrawerToggleButton tintColor={color} />
}

interface ConfigureScreenHeaderOptions {
  headerTitle?: string
  title?: string
  showBack?: boolean
  showMenu?: boolean
  showAction?: boolean
  actionIcon?: React.ReactNode
  onActionPress?: () => void
  headerBackTitle?: string
}

/**
 * Utility function to configure consistent screen headers across the app
 *
 * @param options Configuration options for the header
 * @returns Header configuration object for React Navigation
 */
export function configureScreenHeader(
  componentOrOptions: ComponentType | ConfigureScreenHeaderOptions,
  options?: ConfigureScreenHeaderOptions
  // biome-ignore lint/suspicious/noExplicitAny: claude did thiis
): any {
  // If first argument is a component
  if (typeof componentOrOptions === 'function') {
    const Component = componentOrOptions
    const headerOptions = options || {}

    // @ts-expect-error - we're assigning navigation options to the component
    Component.screenOptions = {
      headerTitle: headerOptions.headerTitle || headerOptions.title,
      headerBackTitle: headerOptions.headerBackTitle,
      headerShown: true,
      headerShadowVisible: false,
      headerTitleAlign: 'center' as const,
      headerLeft: headerOptions.showMenu
        ? () => <MenuButton />
        : headerOptions.showBack
          ? undefined // Use default back button
          : () => <View />,
      headerRight: headerOptions.showAction
        ? () => (
            <Button
              borderStyle="unset"
              backgroundColor="transparent"
              onPress={headerOptions.onActionPress}
            >
              {headerOptions.actionIcon || <Plus size={24} />}
            </Button>
          )
        : () => <View />,
    }

    return Component
  }

  // Original function behavior for backward compatibility
  const headerOptions = componentOrOptions
  return {
    title: headerOptions.title,
    headerTitle: () => (
      <XStack alignItems="center" justifyContent="center">
        <H4>{headerOptions.title}</H4>
      </XStack>
    ),
    headerBackTitle: headerOptions.headerBackTitle,
    headerShown: true,
    headerShadowVisible: false,
    headerTitleAlign: 'center' as const,
    headerLeft: headerOptions.showMenu
      ? () => <MenuButton />
      : headerOptions.showBack
        ? undefined // Use default back button
        : () => <View />,
    headerRight: headerOptions.showAction
      ? () => (
          <Button
            borderStyle="unset"
            backgroundColor="transparent"
            onPress={headerOptions.onActionPress}
          >
            {headerOptions.actionIcon || <Plus size={24} />}
          </Button>
        )
      : () => <View />,
  }
}
