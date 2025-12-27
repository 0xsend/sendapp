import {
  Button,
  Dialog,
  H4,
  Input,
  Paragraph,
  Select,
  Sheet,
  Spinner,
  Text,
  TextArea,
  XStack,
  YStack,
  useAppToast,
} from '@my/ui'
import { Check, ChevronDown } from '@tamagui/lucide-icons'
import { IconAccount, IconSearch, IconX } from 'app/components/icons'
import { AvatarProfile } from 'app/features/profile/AvatarProfile'
import { useProfileLookup } from 'app/utils/useProfileLookup'
import { memo, useCallback, useMemo, useState } from 'react'
import { Platform } from 'react-native'
import { isAddress } from 'viem'
import { CONTACTS_CUSTOM_NAME_MAX, CONTACTS_NOTES_MAX } from '../constants'
import { useAddContactByLookup, useAddExternalContact } from '../hooks/useContactMutation'
import type { LookupType } from '../types'

/**
 * Supported chains for external contacts with CAIP-2 chain IDs.
 */
const SUPPORTED_CHAINS = [
  { value: 'eip155:8453', name: 'Base' },
  { value: 'eip155:1', name: 'Ethereum' },
  { value: 'solana:mainnet', name: 'Solana' },
] as const

type SupportedChainId = (typeof SUPPORTED_CHAINS)[number]['value']

/**
 * Tab type for the form.
 */
type TabType = 'send-user' | 'external-address'

/**
 * Props for the AddContactForm component.
 */
interface AddContactFormProps {
  /** Whether the form is open */
  open: boolean
  /** Callback when open state changes */
  onOpenChange: (open: boolean) => void
  /** Callback when a contact is successfully added */
  onSuccess?: () => void
  /** Initial tab to show */
  initialTab?: TabType
}

/**
 * Form for adding a new contact.
 *
 * Has two tabs:
 * 1. Send User Tab: Search for a user by sendtag or send_id
 * 2. External Address Tab: Add an external wallet address
 *
 * @example
 * ```tsx
 * <AddContactForm
 *   open={isOpen}
 *   onOpenChange={setIsOpen}
 *   onSuccess={refetchContacts}
 * />
 * ```
 */
export const AddContactForm = memo(function AddContactForm({
  open,
  onOpenChange,
  onSuccess,
  initialTab = 'send-user',
}: AddContactFormProps) {
  const toast = useAppToast()

  // Tab state
  const [activeTab, setActiveTab] = useState<TabType>(initialTab)

  // Send user tab state
  const [identifier, setIdentifier] = useState('')
  const [lookupType, setLookupType] = useState<LookupType>('tag')

  // External address tab state
  const [externalAddress, setExternalAddress] = useState('')
  const [chainId, setChainId] = useState<SupportedChainId>('eip155:8453')
  const [customName, setCustomName] = useState('')
  const [notes, setNotes] = useState('')

  // Mutations
  const { mutate: addContactByLookup, isPending: isAddingByLookup } = useAddContactByLookup()
  const { mutate: addExternalContact, isPending: isAddingExternal } = useAddExternalContact()

  // Profile lookup for preview (debounced search happens in component)
  const cleanedIdentifier = useMemo(() => {
    // Remove leading @ or / for tags
    const trimmed = identifier.trim()
    if (lookupType === 'tag') {
      return trimmed.replace(/^[@/]/, '')
    }
    return trimmed
  }, [identifier, lookupType])

  const {
    data: profileData,
    isLoading: isLookingUp,
    error: lookupError,
  } = useProfileLookup(lookupType, cleanedIdentifier.length >= 2 ? cleanedIdentifier : '')

  // Validation
  const isValidSendUser = cleanedIdentifier.length >= 2 && profileData !== null && !lookupError
  const isValidExternalAddress = useMemo(() => {
    if (chainId.startsWith('eip155:')) {
      return isAddress(externalAddress)
    }
    if (chainId === 'solana:mainnet') {
      // Basic Solana address validation (base58, 32-44 chars)
      return /^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(externalAddress)
    }
    return false
  }, [externalAddress, chainId])

  const isAddDisabled =
    activeTab === 'send-user'
      ? !isValidSendUser || isAddingByLookup
      : !isValidExternalAddress || !customName.trim() || isAddingExternal

  // Reset form state
  const resetForm = useCallback(() => {
    setIdentifier('')
    setExternalAddress('')
    setChainId('eip155:8453')
    setCustomName('')
    setNotes('')
    setLookupType('tag')
  }, [])

  // Handle close
  const handleClose = useCallback(() => {
    resetForm()
    onOpenChange(false)
  }, [resetForm, onOpenChange])

  // Handle add send user
  const handleAddSendUser = useCallback(() => {
    if (!isValidSendUser) return

    addContactByLookup(
      {
        identifier: cleanedIdentifier,
        lookupType,
      },
      {
        onSuccess: () => {
          toast.show('Contact added')
          resetForm()
          onOpenChange(false)
          onSuccess?.()
        },
        onError: (error) => {
          toast.error(error.message)
        },
      }
    )
  }, [
    isValidSendUser,
    cleanedIdentifier,
    lookupType,
    addContactByLookup,
    toast,
    resetForm,
    onOpenChange,
    onSuccess,
  ])

  // Handle add external contact
  const handleAddExternalContact = useCallback(() => {
    if (!isValidExternalAddress || !customName.trim()) return

    addExternalContact(
      {
        externalAddress,
        chainId,
        customName: customName.trim(),
        notes: notes.trim() || undefined,
      },
      {
        onSuccess: () => {
          toast.show('Contact added')
          resetForm()
          onOpenChange(false)
          onSuccess?.()
        },
        onError: (error) => {
          toast.error(error.message)
        },
      }
    )
  }, [
    isValidExternalAddress,
    externalAddress,
    chainId,
    customName,
    notes,
    addExternalContact,
    toast,
    resetForm,
    onOpenChange,
    onSuccess,
  ])

  // Build profile object for AvatarProfile
  const profileForAvatar = useMemo(
    () =>
      profileData
        ? {
            name: profileData.name,
            avatar_url: profileData.avatar_url,
            is_verified: profileData.is_verified,
          }
        : null,
    [profileData]
  )

  // Form content
  const formContent = (
    <YStack gap="$4" padding="$4" pb="$6">
      {/* Header */}
      <XStack justifyContent="space-between" alignItems="center">
        <H4>Add Contact</H4>
        <Button
          size="$3"
          circular
          chromeless
          onPress={handleClose}
          icon={<IconX size={20} color="$color12" />}
        />
      </XStack>

      {/* Tab buttons */}
      <XStack gap="$2">
        <Button
          flex={1}
          size="$3"
          backgroundColor={activeTab === 'send-user' ? '$color8' : '$color4'}
          onPress={() => setActiveTab('send-user')}
          pressStyle={{ opacity: 0.8 }}
        >
          <Button.Text
            color={activeTab === 'send-user' ? '$color12' : '$color11'}
            fontWeight={activeTab === 'send-user' ? '600' : '400'}
          >
            Send User
          </Button.Text>
        </Button>
        <Button
          flex={1}
          size="$3"
          backgroundColor={activeTab === 'external-address' ? '$color8' : '$color4'}
          onPress={() => setActiveTab('external-address')}
          pressStyle={{ opacity: 0.8 }}
        >
          <Button.Text
            color={activeTab === 'external-address' ? '$color12' : '$color11'}
            fontWeight={activeTab === 'external-address' ? '600' : '400'}
          >
            External Address
          </Button.Text>
        </Button>
      </XStack>

      {/* Send User Tab */}
      {activeTab === 'send-user' && (
        <YStack gap="$4">
          {/* Lookup type selector */}
          <XStack gap="$2">
            <Button
              flex={1}
              size="$3"
              variant={lookupType === 'tag' ? 'outlined' : undefined}
              backgroundColor={lookupType === 'tag' ? '$color6' : '$color4'}
              onPress={() => setLookupType('tag')}
            >
              <Button.Text>Sendtag</Button.Text>
            </Button>
            <Button
              flex={1}
              size="$3"
              variant={lookupType === 'sendid' ? 'outlined' : undefined}
              backgroundColor={lookupType === 'sendid' ? '$color6' : '$color4'}
              onPress={() => setLookupType('sendid')}
            >
              <Button.Text>Send ID</Button.Text>
            </Button>
          </XStack>

          {/* Search input */}
          <XStack gap="$2" alignItems="center">
            <YStack flex={1} position="relative">
              <Input
                size="$4"
                placeholder={lookupType === 'tag' ? 'Enter sendtag' : 'Enter send ID'}
                value={identifier}
                onChangeText={setIdentifier}
                autoCapitalize="none"
                autoCorrect={false}
              />
              <XStack
                position="absolute"
                right="$3"
                top={0}
                bottom={0}
                alignItems="center"
                justifyContent="center"
              >
                {isLookingUp && <Spinner size="small" />}
              </XStack>
            </YStack>
          </XStack>

          {/* User preview */}
          {cleanedIdentifier.length >= 2 && (
            <YStack backgroundColor="$color3" borderRadius="$4" padding="$3" gap="$3">
              {isLookingUp ? (
                <XStack alignItems="center" justifyContent="center" padding="$3">
                  <Spinner />
                </XStack>
              ) : profileData ? (
                <XStack gap="$3" alignItems="center">
                  {profileForAvatar ? (
                    <AvatarProfile profile={profileForAvatar} size="$6" />
                  ) : (
                    <XStack
                      width="$6"
                      height="$6"
                      backgroundColor="$color4"
                      borderRadius="$4"
                      alignItems="center"
                      justifyContent="center"
                    >
                      <IconAccount size="$4" color="$color11" />
                    </XStack>
                  )}
                  <YStack flex={1}>
                    <Text fontWeight="600" fontSize="$5">
                      {profileData.name ?? 'Unknown'}
                    </Text>
                    {profileData.all_tags && profileData.all_tags.length > 0 && (
                      <Text color="$color10" fontSize="$3">
                        /{profileData.all_tags.join(', /')}
                      </Text>
                    )}
                  </YStack>
                  <IconSearch size={20} color="$green10" />
                </XStack>
              ) : lookupError ? (
                <Paragraph color="$red10" textAlign="center">
                  Error looking up user
                </Paragraph>
              ) : (
                <Paragraph color="$color10" textAlign="center">
                  No user found with this {lookupType === 'tag' ? 'sendtag' : 'send ID'}
                </Paragraph>
              )}
            </YStack>
          )}

          {/* Add button */}
          <Button
            size="$4"
            theme="active"
            onPress={handleAddSendUser}
            disabled={isAddDisabled}
            icon={isAddingByLookup ? <Spinner size="small" /> : undefined}
          >
            <Button.Text>Add Contact</Button.Text>
          </Button>
        </YStack>
      )}

      {/* External Address Tab */}
      {activeTab === 'external-address' && (
        <YStack gap="$4">
          {/* Chain selector */}
          <YStack gap="$2">
            <Text fontWeight="600" color="$color11">
              Chain
            </Text>
            <Select value={chainId} onValueChange={(val) => setChainId(val as SupportedChainId)}>
              <Select.Trigger iconAfter={ChevronDown}>
                <Select.Value placeholder="Select chain" />
              </Select.Trigger>

              <Select.Content zIndex={200000}>
                <Select.Viewport>
                  <Select.Group>
                    {SUPPORTED_CHAINS.map((chain, i) => (
                      <Select.Item key={chain.value} index={i} value={chain.value}>
                        <Select.ItemText>{chain.name}</Select.ItemText>
                        <Select.ItemIndicator marginLeft="auto">
                          <Check size={16} />
                        </Select.ItemIndicator>
                      </Select.Item>
                    ))}
                  </Select.Group>
                </Select.Viewport>
              </Select.Content>
            </Select>
          </YStack>

          {/* Address input */}
          <YStack gap="$2">
            <Text fontWeight="600" color="$color11">
              Wallet Address
            </Text>
            <Input
              size="$4"
              placeholder={chainId.startsWith('eip155:') ? '0x...' : 'Enter Solana address'}
              value={externalAddress}
              onChangeText={setExternalAddress}
              autoCapitalize="none"
              autoCorrect={false}
              fontFamily="$mono"
            />
            {externalAddress.length > 0 && !isValidExternalAddress && (
              <Paragraph color="$red10" fontSize="$2">
                Invalid address format
              </Paragraph>
            )}
          </YStack>

          {/* Custom name (required) */}
          <YStack gap="$2">
            <Text fontWeight="600" color="$color11">
              Display Name <Text color="$red10">*</Text>
            </Text>
            <Input
              size="$4"
              placeholder="Enter a name for this contact"
              value={customName}
              onChangeText={setCustomName}
              maxLength={CONTACTS_CUSTOM_NAME_MAX}
            />
          </YStack>

          {/* Notes (optional) */}
          <YStack gap="$2">
            <Text fontWeight="600" color="$color11">
              Notes <Text color="$color10">(optional)</Text>
            </Text>
            <TextArea
              placeholder="Add notes about this contact..."
              value={notes}
              onChangeText={setNotes}
              maxLength={CONTACTS_NOTES_MAX}
              minHeight={80}
            />
          </YStack>

          {/* Add button */}
          <Button
            size="$4"
            theme="active"
            onPress={handleAddExternalContact}
            disabled={isAddDisabled}
            icon={isAddingExternal ? <Spinner size="small" /> : undefined}
          >
            <Button.Text>Add Contact</Button.Text>
          </Button>
        </YStack>
      )}
    </YStack>
  )

  // Web version using Dialog
  if (Platform.OS === 'web') {
    return (
      <Dialog modal open={open} onOpenChange={onOpenChange}>
        <Dialog.Portal>
          <Dialog.Overlay
            key="overlay"
            animation="quick"
            opacity={0.5}
            enterStyle={{ opacity: 0 }}
            exitStyle={{ opacity: 0 }}
          />
          <Dialog.Content
            bordered
            elevate
            key="content"
            animateOnly={['transform', 'opacity']}
            animation={[
              'quick',
              {
                opacity: {
                  overshootClamping: true,
                },
              },
            ]}
            enterStyle={{ x: 0, y: -20, opacity: 0, scale: 0.9 }}
            exitStyle={{ x: 0, y: 10, opacity: 0, scale: 0.95 }}
            width="90%"
            maxWidth={450}
            overflow="hidden"
          >
            {formContent}
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog>
    )
  }

  // Native version using Sheet
  return (
    <Sheet
      open={open}
      modal
      onOpenChange={onOpenChange}
      dismissOnSnapToBottom
      dismissOnOverlayPress
      native
      snapPoints={[85]}
    >
      <Sheet.Frame key="add-contact-sheet">
        <Sheet.ScrollView>{formContent}</Sheet.ScrollView>
      </Sheet.Frame>
      <Sheet.Overlay />
    </Sheet>
  )
})
