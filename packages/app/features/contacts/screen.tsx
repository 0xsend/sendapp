import { ActionButton, H4, Paragraph, YStack } from '@my/ui'
import { IconPlus } from 'app/components/icons'
import { useContactsScreenParams } from 'app/routers/params'
import { useMemo, useState } from 'react'
import { Platform } from 'react-native'
import { ContactBookProvider, useContactBook } from './ContactBookProvider'
import { AddContactForm } from './components/AddContactForm'
import { ContactDetailSheet } from './components/ContactDetailSheet'
import { ContactFilters } from './components/ContactFilters'
import { ContactList } from './components/ContactList'
import { ContactSearchBar } from './components/ContactSearchBar'
import type { ContactFilter, ContactView } from './types'

/**
 * Contact book screen.
 *
 * Provides the ContactBookProvider and renders the contact book UI.
 * Supports filtering by label via URL query parameter: /contacts?label={labelId}
 */
export function ContactsScreen() {
  const [{ label }] = useContactsScreenParams()

  // Parse label param into initial filter
  const initialFilter = useMemo<ContactFilter>(() => {
    if (label) {
      const labelId = Number.parseInt(label, 10)
      if (!Number.isNaN(labelId)) {
        return { type: 'label', labelId }
      }
    }
    return { type: 'all' }
  }, [label])

  return (
    <ContactBookProvider initialFilter={initialFilter}>
      <YStack
        f={1}
        width="100%"
        pb={Platform.OS === 'web' ? '$3' : 0}
        pt="$3"
        gap="$4"
        px={Platform.OS === 'web' ? 0 : '$4'}
        $gtMd={{ px: Platform.OS === 'web' ? 0 : '$6' }}
        $gtLg={{ pt: 0, gap: '$5', px: Platform.OS === 'web' ? 0 : '$11' }}
      >
        <ContactsBody />
      </YStack>
    </ContactBookProvider>
  )
}

/**
 * Contact book body component.
 */
function ContactsBody() {
  const { error, refetch } = useContactBook()
  const [showAddForm, setShowAddForm] = useState(false)
  const [selectedContact, setSelectedContact] = useState<ContactView | null>(null)

  const handleContactPress = (contact: ContactView) => {
    setSelectedContact(contact)
  }

  const handleCloseDetail = () => {
    setSelectedContact(null)
  }

  const handleAddSuccess = () => {
    setShowAddForm(false)
    refetch()
  }

  const handleContactUpdate = () => {
    refetch()
  }

  if (error) {
    return (
      <YStack key="error" gap="$4" mb="$4">
        <H4 theme="alt2">Error</H4>
        <Paragraph>{error.message?.split('.').at(0) ?? 'An error occurred'}</Paragraph>
      </YStack>
    )
  }

  return (
    <YStack gap="$4" f={1}>
      {/* Search bar */}
      <ContactSearchBar placeholder="Search contacts..." autoFocus={Platform.OS === 'web'} />

      {/* Filters and Add button row */}
      <ContactFilters
        rightElement={
          <ActionButton
            testID="addContactButton"
            onPress={() => setShowAddForm(true)}
            icon={<IconPlus size={16} color="$black" />}
          >
            <ActionButton.Text>Add</ActionButton.Text>
          </ActionButton>
        }
      />

      {/* Contact list */}
      <ContactList onContactPress={handleContactPress} />

      {/* Add contact form */}
      <AddContactForm
        open={showAddForm}
        onOpenChange={setShowAddForm}
        onSuccess={handleAddSuccess}
      />

      {/* Contact detail sheet */}
      {selectedContact && (
        <ContactDetailSheet
          contact={selectedContact}
          open={Boolean(selectedContact)}
          onOpenChange={(open) => !open && handleCloseDetail()}
          onUpdate={handleContactUpdate}
        />
      )}
    </YStack>
  )
}
