import {
  Button,
  Dialog,
  H4,
  Paragraph,
  Sheet,
  Spinner,
  Text,
  VisuallyHidden,
  XStack,
  YStack,
  useAppToast,
} from '@my/ui'
import { IconAccount, IconSearch, IconX } from 'app/components/icons'
import { AvatarProfile } from 'app/features/profile/AvatarProfile'
import { formFields, SchemaForm } from 'app/utils/SchemaForm'
import { useProfileLookup } from 'app/utils/useProfileLookup'
import { memo, useCallback, useMemo, useState } from 'react'
import { useForm } from 'react-hook-form'
import { Platform } from 'react-native'
import { z } from 'zod'
import { CONTACTS_CUSTOM_NAME_MAX, CONTACTS_NOTES_MAX } from '../constants'
import { useAddContactByLookup, useAddExternalContact } from '../hooks/useContactMutation'
import type { LookupType } from '../types'
import { LabelPicker } from './LabelPicker'

/**
 * Supported chains for external contacts with CAIP-2 chain IDs.
 * Currently only Base is supported.
 */
const SUPPORTED_CHAINS = [{ value: 'eip155:8453', name: 'Base' }] as const

type SupportedChainId = (typeof SUPPORTED_CHAINS)[number]['value']
const DEFAULT_CHAIN_ID: SupportedChainId = 'eip155:8453'

const SendUserSchema = z.object({
  identifier: formFields.text,
})

const ExternalContactSchema = z.object({
  externalAddress: formFields.evmAddress,
  customName: z.string().trim().min(1, 'Display name is required').max(CONTACTS_CUSTOM_NAME_MAX),
  notes: formFields.textarea,
})

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

  const sendUserForm = useForm<z.infer<typeof SendUserSchema>>()
  const externalContactForm = useForm<z.infer<typeof ExternalContactSchema>>()

  // Tab state
  const [activeTab, setActiveTab] = useState<TabType>(initialTab)

  const [lookupType, setLookupType] = useState<LookupType>('tag')

  // Label selection state
  const [selectedLabelIds, setSelectedLabelIds] = useState<number[]>([])

  // Mutations
  const { mutate: addContactByLookup, isPending: isAddingByLookup } = useAddContactByLookup()
  const { mutate: addExternalContact, isPending: isAddingExternal } = useAddExternalContact()

  const identifier = sendUserForm.watch('identifier') ?? ''
  const externalAddress = externalContactForm.watch('externalAddress') ?? ''
  const customName = externalContactForm.watch('customName') ?? ''
  const notes = externalContactForm.watch('notes') ?? ''

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
  const isValidExternalAddress = useMemo(
    () => formFields.evmAddress.safeParse(externalAddress).success,
    [externalAddress]
  )
  const isValidExternalContact = useMemo(
    () =>
      ExternalContactSchema.safeParse({
        externalAddress,
        customName,
        notes,
      }).success,
    [externalAddress, customName, notes]
  )

  const isAddDisabled =
    activeTab === 'send-user'
      ? !isValidSendUser || isAddingByLookup
      : !isValidExternalContact || isAddingExternal

  // Reset form state
  const resetForm = useCallback(() => {
    sendUserForm.reset({ identifier: '' })
    externalContactForm.reset({
      externalAddress: '',
      customName: '',
      notes: '',
    })
    setLookupType('tag')
    setSelectedLabelIds([])
  }, [externalContactForm, sendUserForm])

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
        labelIds: selectedLabelIds.length > 0 ? selectedLabelIds : undefined,
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
    selectedLabelIds,
    addContactByLookup,
    toast,
    resetForm,
    onOpenChange,
    onSuccess,
  ])

  // Handle add external contact
  const handleAddExternalContact = useCallback(
    (values: z.infer<typeof ExternalContactSchema>) => {
      addExternalContact(
        {
          externalAddress: values.externalAddress,
          chainId: DEFAULT_CHAIN_ID,
          customName: values.customName,
          notes: values.notes.trim() || undefined,
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
    },
    [addExternalContact, toast, resetForm, onOpenChange, onSuccess]
  )

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
          backgroundColor={activeTab === 'send-user' ? '$background' : '$color5'}
          borderWidth={activeTab === 'send-user' ? 1 : 0}
          borderColor="$color8"
          onPress={() => setActiveTab('send-user')}
          pressStyle={{ opacity: 0.8 }}
        >
          <Button.Text color="$color12" fontWeight={activeTab === 'send-user' ? '600' : '400'}>
            Send User
          </Button.Text>
        </Button>
        <Button
          flex={1}
          size="$3"
          backgroundColor={activeTab === 'external-address' ? '$background' : '$color5'}
          borderWidth={activeTab === 'external-address' ? 1 : 0}
          borderColor="$color8"
          onPress={() => setActiveTab('external-address')}
          pressStyle={{ opacity: 0.8 }}
        >
          <Button.Text
            color="$color12"
            fontWeight={activeTab === 'external-address' ? '600' : '400'}
          >
            External Address
          </Button.Text>
        </Button>
      </XStack>

      {/* Send User Tab */}
      {activeTab === 'send-user' && (
        <SchemaForm
          form={sendUserForm}
          schema={SendUserSchema}
          defaultValues={{ identifier: '' }}
          onSubmit={() => handleAddSendUser()}
          props={{
            identifier: {
              size: '$4',
              placeholder: lookupType === 'tag' ? 'Enter sendtag' : 'Enter send ID',
              placeholderTextColor: '$color10',
              autoCapitalize: 'none',
              autoCorrect: false,
              fontWeight: 'normal',
              iconAfter: isLookingUp ? <Spinner size="small" /> : undefined,
              fieldsetProps: { flex: 1 },
            },
          }}
        >
          {({ identifier: identifierField }) => (
            <YStack gap="$4">
              {/* Lookup type selector */}
              <XStack gap="$2">
                <Button
                  flex={1}
                  size="$3"
                  backgroundColor={lookupType === 'tag' ? '$background' : '$color5'}
                  borderWidth={lookupType === 'tag' ? 1 : 0}
                  borderColor="$color8"
                  onPress={() => setLookupType('tag')}
                >
                  <Button.Text color="$color12">Sendtag</Button.Text>
                </Button>
                <Button
                  flex={1}
                  size="$3"
                  backgroundColor={lookupType === 'sendid' ? '$background' : '$color5'}
                  borderWidth={lookupType === 'sendid' ? 1 : 0}
                  borderColor="$color8"
                  onPress={() => setLookupType('sendid')}
                >
                  <Button.Text color="$color12">Send ID</Button.Text>
                </Button>
              </XStack>

              {/* Search input */}
              <XStack gap="$2" alignItems="center">
                {identifierField}
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
                          {profileData.all_tags?.[0]
                            ? `/${profileData.all_tags[0]}`
                            : profileData.sendid
                              ? `#${profileData.sendid}`
                              : (profileData.name ?? '')}
                        </Text>
                        {profileData.name && (
                          <Text color="$color10" fontSize="$3">
                            {profileData.name}
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

              {/* Label picker */}
              <LabelPicker
                selectedLabelIds={selectedLabelIds}
                onSelectionChange={setSelectedLabelIds}
              />

              {/* Add button */}
              <Button
                testID="addContactSubmitButton"
                size="$4"
                theme="green"
                onPress={() => sendUserForm.handleSubmit(() => handleAddSendUser())()}
                disabled={isAddDisabled}
                icon={isAddingByLookup ? <Spinner size="small" /> : undefined}
              >
                <Button.Text color="$black">Add Contact</Button.Text>
              </Button>
            </YStack>
          )}
        </SchemaForm>
      )}

      {/* External Address Tab */}
      {activeTab === 'external-address' && (
        <SchemaForm
          form={externalContactForm}
          schema={ExternalContactSchema}
          defaultValues={{ externalAddress: '', customName: '', notes: '' }}
          onSubmit={handleAddExternalContact}
          props={{
            externalAddress: {
              size: '$4',
              placeholder: '0x...',
              placeholderTextColor: '$color10',
              autoCapitalize: 'none',
              autoCorrect: false,
              fontFamily: '$mono',
              fontWeight: 'normal',
              fieldsetProps: { width: '100%' },
            },
            customName: {
              size: '$4',
              placeholder: 'Enter a name for this contact',
              placeholderTextColor: '$color10',
              maxLength: CONTACTS_CUSTOM_NAME_MAX,
              fontWeight: 'normal',
              fieldsetProps: { width: '100%' },
            },
            notes: {
              placeholder: 'Add notes about this contact...',
              placeholderTextColor: '$color10',
              maxLength: CONTACTS_NOTES_MAX,
              minHeight: 80,
            },
          }}
        >
          {({
            externalAddress: externalAddressField,
            customName: customNameField,
            notes: notesField,
          }) => (
            <YStack gap="$4">
              {/* Chain info (Base only for now) */}
              <XStack gap="$2" alignItems="center">
                <Text fontWeight="600" color="$color11">
                  Chain:
                </Text>
                <Text color="$color12">Base</Text>
              </XStack>

              {/* Address input */}
              <YStack gap="$2">
                <Text fontWeight="600" color="$color11">
                  Wallet Address
                </Text>
                {externalAddressField}
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
                {customNameField}
              </YStack>

              {/* Notes (optional) */}
              <YStack gap="$2">
                <Text fontWeight="600" color="$color11">
                  Notes <Text color="$color10">(optional)</Text>
                </Text>
                {notesField}
              </YStack>

              {/* Add button */}
              <Button
                testID="addExternalContactSubmitButton"
                size="$4"
                theme="green"
                onPress={() => externalContactForm.handleSubmit(handleAddExternalContact)()}
                disabled={isAddDisabled}
                icon={isAddingExternal ? <Spinner size="small" /> : undefined}
              >
                <Button.Text color="$black">Add Contact</Button.Text>
              </Button>
            </YStack>
          )}
        </SchemaForm>
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
            <VisuallyHidden>
              <Dialog.Title>Add Contact</Dialog.Title>
            </VisuallyHidden>
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
