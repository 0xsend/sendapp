/**
 * Contact label hooks for CRUD operations and label assignments.
 *
 * Tables: contact_labels, contact_label_assignments
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useSupabase } from 'app/utils/supabase/useSupabase'
import { CONTACTS_LABEL_NAME_MAX, CONTACTS_QUERY_KEY } from '../constants'
import type { ContactLabel } from '../types'

/** Query key for contact labels */
const LABELS_QUERY_KEY = [CONTACTS_QUERY_KEY, 'labels'] as const

/**
 * Hook for fetching all contact labels for the current user.
 *
 * @example
 * ```tsx
 * const { data: labels, isLoading } = useContactLabels()
 *
 * return labels?.map(label => <LabelChip key={label.id} label={label} />)
 * ```
 */
export function useContactLabels() {
  const supabase = useSupabase()

  return useQuery({
    queryKey: LABELS_QUERY_KEY,

    async queryFn(): Promise<ContactLabel[]> {
      const { data, error } = await supabase
        .from('contact_labels')
        .select('*')
        .order('name', { ascending: true })

      if (error) {
        throw new Error(error.message)
      }

      return data ?? []
    },

    staleTime: 60_000, // Labels don't change often
  })
}

// Attach static query key for external use
useContactLabels.queryKey = LABELS_QUERY_KEY

/**
 * Parameters for creating a new label.
 */
interface CreateLabelParams {
  /** Label name (required) */
  name: string
  /** Optional hex color for the label */
  color?: string
}

/**
 * Hook for creating a new contact label.
 *
 * @example
 * ```tsx
 * const { mutate: createLabel } = useCreateContactLabel()
 *
 * createLabel({ name: 'Family', color: '#FF5733' })
 * ```
 */
export function useCreateContactLabel() {
  const supabase = useSupabase()
  const queryClient = useQueryClient()

  return useMutation({
    async mutationFn(params: CreateLabelParams): Promise<ContactLabel> {
      // Validate name length
      if (params.name.length > CONTACTS_LABEL_NAME_MAX) {
        throw new Error(`Label name must be ${CONTACTS_LABEL_NAME_MAX} characters or less`)
      }

      if (params.name.trim().length === 0) {
        throw new Error('Label name cannot be empty')
      }

      // owner_id is set by DEFAULT auth.uid() in the database
      // TypeScript requires it but DB provides the default
      const insertData = { name: params.name.trim(), color: params.color ?? null }
      const { data, error } = await supabase
        .from('contact_labels')
        .insert(insertData as typeof insertData & { owner_id: string })
        .select()
        .single()

      if (error) {
        throw new Error(error.message)
      }

      if (!data) {
        throw new Error('No label returned from creation')
      }

      return data
    },

    async onSuccess() {
      await queryClient.invalidateQueries({ queryKey: LABELS_QUERY_KEY })
    },
  })
}

/**
 * Parameters for updating a label.
 */
interface UpdateLabelParams {
  /** Label ID to update */
  labelId: number
  /** New label name */
  name?: string
  /** New hex color */
  color?: string | null
}

/**
 * Hook for updating an existing contact label.
 *
 * @example
 * ```tsx
 * const { mutate: updateLabel } = useUpdateContactLabel()
 *
 * updateLabel({ labelId: 1, name: 'Close Friends' })
 * ```
 */
export function useUpdateContactLabel() {
  const supabase = useSupabase()
  const queryClient = useQueryClient()

  return useMutation({
    async mutationFn(params: UpdateLabelParams): Promise<void> {
      const updateData: Record<string, string | null> = {}

      if (params.name !== undefined) {
        if (params.name.length > CONTACTS_LABEL_NAME_MAX) {
          throw new Error(`Label name must be ${CONTACTS_LABEL_NAME_MAX} characters or less`)
        }
        if (params.name.trim().length === 0) {
          throw new Error('Label name cannot be empty')
        }
        updateData.name = params.name.trim()
      }

      if (params.color !== undefined) {
        updateData.color = params.color
      }

      // Skip if no updates
      if (Object.keys(updateData).length === 0) {
        return
      }

      const { error } = await supabase
        .from('contact_labels')
        .update(updateData)
        .eq('id', params.labelId)

      if (error) {
        throw new Error(error.message)
      }
    },

    async onSuccess() {
      await queryClient.invalidateQueries({ queryKey: LABELS_QUERY_KEY })
    },
  })
}

/**
 * Hook for deleting a contact label.
 *
 * Note: This will also remove the label from all contacts that have it assigned.
 *
 * @example
 * ```tsx
 * const { mutate: deleteLabel } = useDeleteContactLabel()
 *
 * deleteLabel({ labelId: 1 })
 * ```
 */
export function useDeleteContactLabel() {
  const supabase = useSupabase()
  const queryClient = useQueryClient()

  return useMutation({
    async mutationFn({ labelId }: { labelId: number }): Promise<void> {
      const { error } = await supabase.from('contact_labels').delete().eq('id', labelId)

      if (error) {
        throw new Error(error.message)
      }
    },

    async onSuccess() {
      // Invalidate both labels and contacts since contacts may have had this label
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: LABELS_QUERY_KEY }),
        queryClient.invalidateQueries({ queryKey: [CONTACTS_QUERY_KEY] }),
      ])
    },
  })
}

/**
 * Parameters for assigning a label to a contact.
 */
interface AssignLabelParams {
  /** Contact ID */
  contactId: number
  /** Label ID to assign */
  labelId: number
}

/**
 * Hook for assigning a label to a contact.
 *
 * @example
 * ```tsx
 * const { mutate: assignLabel } = useAssignContactLabel()
 *
 * assignLabel({ contactId: 123, labelId: 1 })
 * ```
 */
export function useAssignContactLabel() {
  const supabase = useSupabase()
  const queryClient = useQueryClient()

  return useMutation({
    async mutationFn(params: AssignLabelParams): Promise<void> {
      const { error } = await supabase
        .from('contact_label_assignments')
        .insert({ contact_id: params.contactId, label_id: params.labelId })

      if (error) {
        // Ignore duplicate assignment errors (unique constraint)
        if (!error.message.includes('duplicate') && !error.code?.includes('23505')) {
          throw new Error(error.message)
        }
      }
    },

    async onSuccess() {
      await queryClient.invalidateQueries({ queryKey: [CONTACTS_QUERY_KEY] })
    },
  })
}

/**
 * Hook for removing a label from a contact.
 *
 * @example
 * ```tsx
 * const { mutate: unassignLabel } = useUnassignContactLabel()
 *
 * unassignLabel({ contactId: 123, labelId: 1 })
 * ```
 */
export function useUnassignContactLabel() {
  const supabase = useSupabase()
  const queryClient = useQueryClient()

  return useMutation({
    async mutationFn(params: AssignLabelParams): Promise<void> {
      const { error } = await supabase
        .from('contact_label_assignments')
        .delete()
        .eq('contact_id', params.contactId)
        .eq('label_id', params.labelId)

      if (error) {
        throw new Error(error.message)
      }
    },

    async onSuccess() {
      await queryClient.invalidateQueries({ queryKey: [CONTACTS_QUERY_KEY] })
    },
  })
}
