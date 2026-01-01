import { Card, Paragraph, Separator, XStack, YStack, Switch, Theme, Spinner } from '@my/ui'
import { SettingsHeader } from 'app/features/account/components/SettingsHeader'
import { useCallback } from 'react'
import { Linking } from 'react-native'
import { BellOff, Check, Smartphone } from '@tamagui/lucide-icons'
import { useNotifications } from 'app/utils/useNotifications'
import * as Notifications from 'expo-notifications'

interface NotificationOptionProps {
  title: string
  description: string
  icon: React.ReactNode
  isEnabled: boolean
  isLoading: boolean
  isDisabled: boolean
  onToggle: () => void
}

const NotificationOption = ({
  title,
  description,
  icon,
  isEnabled,
  isLoading,
  isDisabled,
  onToggle,
}: NotificationOptionProps) => {
  return (
    <XStack ai="center" jc="space-between" px={'$2'} py={'$3'} br={'$4'}>
      <XStack ai="center" gap={'$3'} flex={1}>
        {icon}
        <YStack flex={1}>
          <Paragraph size={'$5'}>{title}</Paragraph>
          <Paragraph size={'$2'} color={'$gray10'}>
            {description}
          </Paragraph>
        </YStack>
      </XStack>
      <Theme name={isEnabled ? 'green' : 'gray'}>
        <Switch
          size="$3"
          checked={isEnabled}
          onCheckedChange={onToggle}
          disabled={isDisabled || isLoading}
          opacity={isLoading ? 0.5 : 1}
          bg={isEnabled ? '$primary' : '$gray6'}
          borderColor={isEnabled ? '$primary' : '$gray6'}
        >
          <Switch.Thumb animation="quick" bg="$background" />
        </Switch>
      </Theme>
    </XStack>
  )
}

export const NotificationPreferences = () => {
  const {
    isEnabled,
    permissionStatus,
    isRequestingPermission,
    error,
    requestPermissions,
    registerToken,
    unregisterToken,
  } = useNotifications({ autoRegister: false, enableEventListeners: false })

  const isLoading = isRequestingPermission
  const isDenied = permissionStatus === Notifications.PermissionStatus.DENIED
  const isUndetermined = permissionStatus === Notifications.PermissionStatus.UNDETERMINED

  const handleToggle = useCallback(async () => {
    if (isEnabled) {
      await unregisterToken()
    } else {
      const granted = await requestPermissions()
      if (granted) {
        await registerToken()
      }
    }
  }, [isEnabled, requestPermissions, registerToken, unregisterToken])

  const handleOpenSettings = useCallback(() => {
    void Linking.openSettings()
  }, [])

  // Still loading permission status
  if (permissionStatus === null) {
    return (
      <YStack gap={'$3.5'} w={'100%'}>
        <SettingsHeader>Notifications</SettingsHeader>
        <Card gap={'$3'} padded size={'$4'} ai="center" jc="center" minHeight={150}>
          <Spinner size="large" color="$primary" />
        </Card>
      </YStack>
    )
  }

  // Permission denied - need to go to settings
  if (isDenied) {
    return (
      <YStack gap={'$3.5'} w={'100%'}>
        <SettingsHeader>Notifications</SettingsHeader>
        <Card gap={'$3'} padded size={'$4'}>
          <XStack ai="center" gap={'$3'}>
            <BellOff size={24} color={'$red10'} />
            <YStack flex={1}>
              <Paragraph size={'$4'} color={'$color12'}>
                Notifications Blocked
              </Paragraph>
              <Paragraph size={'$3'} color={'$gray10'}>
                You&apos;ve blocked notifications for Send. To enable them, open your device
                settings.
              </Paragraph>
            </YStack>
          </XStack>
          <Separator boc={'$darkGrayTextField'} opacity={0.2} />
          <XStack
            ai="center"
            jc="center"
            py={'$2'}
            pressStyle={{ opacity: 0.7 }}
            onPress={handleOpenSettings}
            cursor="pointer"
          >
            <Paragraph size={'$4'} color={'$primary'}>
              Open Settings
            </Paragraph>
          </XStack>
        </Card>
      </YStack>
    )
  }

  return (
    <YStack gap={'$3.5'} w={'100%'}>
      <SettingsHeader>Notifications</SettingsHeader>
      <Card gap={'$3'} padded size={'$4'}>
        <Paragraph size={'$4'} color={'$color12'}>
          Get notified when you receive payments and other important activity.
        </Paragraph>
        {error && (
          <Paragraph size={'$2'} color={'$red10'}>
            {error.message}
          </Paragraph>
        )}
        <Separator boc={'$darkGrayTextField'} opacity={0.2} />
        <YStack>
          <NotificationOption
            title="Push Notifications"
            description={
              isEnabled
                ? 'You will receive push notifications on this device'
                : isUndetermined
                  ? 'Enable to receive push notifications'
                  : 'Tap to enable push notifications'
            }
            icon={<Smartphone size={20} color={'$primary'} $theme-light={{ color: '$color12' }} />}
            isEnabled={isEnabled}
            isLoading={isLoading}
            isDisabled={false}
            onToggle={handleToggle}
          />
        </YStack>
        {isEnabled && (
          <>
            <Separator boc={'$darkGrayTextField'} opacity={0.2} />
            <YStack gap={'$2'} pt={'$2'}>
              <Paragraph size={'$3'} color={'$gray10'}>
                You&apos;ll be notified about:
              </Paragraph>
              <XStack ai="center" gap={'$2'}>
                <Check size={14} color={'$green10'} />
                <Paragraph size={'$3'}>Received payments</Paragraph>
              </XStack>
              <XStack ai="center" gap={'$2'}>
                <Check size={14} color={'$green10'} />
                <Paragraph size={'$3'}>Account activity</Paragraph>
              </XStack>
            </YStack>
          </>
        )}
      </Card>
    </YStack>
  )
}
