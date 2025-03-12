import type { Tables, Database } from '@my/supabase/database.types'
import {
  Button,
  ButtonText,
  H2,
  H3,
  ListItem,
  Paragraph,
  Spinner,
  Stack,
  YStack,
  XStack,
  AlertDialog,
  Text,
  useToastController,
} from '@my/ui'

import { Trash2 } from '@tamagui/lucide-icons'
import { IconPlus } from 'app/components/icons'
import { maxNumSendTags } from 'app/data/sendtags'
import { useUser } from 'app/utils/useUser'
import { useRouter } from 'solito/router'
import { useQueryClient } from '@tanstack/react-query'
import { useSendAccount } from 'app/utils/send-accounts'
import { useState } from 'react'
import { api } from 'app/utils/api'

type SendAccount = Database['public']['Tables']['send_accounts']['Row']

export function SendTagScreen() {
  const { tags, isLoading } = useUser()
  const confirmedTags = tags?.filter((tag) => tag.status === 'confirmed')
  const { data: sendAccount } = useSendAccount()
  const queryClient = useQueryClient()
  const toast = useToastController()

  const updateMainTag = api.sendAccount.updateMainTag.useMutation({
    onSuccess: async (data, variables) => {
      const queryKey = [useSendAccount.queryKey]
      queryClient.setQueryData(queryKey, (old: SendAccount) => ({
        ...old,
        main_tag_id: variables.tagId,
      }))

      await Promise.all([
        queryClient.invalidateQueries({ queryKey }),
        queryClient.refetchQueries({
          queryKey,
          exact: true,
        }),
      ])

      toast.show('Main tag updated successfully', { type: 'success' })
    },
    onError: (error) => {
      console.error('Failed to update main tag:', error)
      toast.show('Failed to update main tag', { type: 'error' })
    },
  })

  const handleUpdateMainTag = async (tagId: number) => {
    console.log('Updating main tag:', tagId)
    await updateMainTag.mutateAsync({ tagId })
  }

  if (isLoading)
    return (
      <Stack width="100%" height="100%" justifyContent="center" alignItems="center">
        <Spinner color="$primary" size="large" />
      </Stack>
    )

  return (
    <YStack
      width={'100%'}
      gap="$5"
      pb={'$3.5'}
      jc={'space-between'}
      $gtLg={{
        width: '50%',
      }}
    >
      <YStack gap="$5">
        <YStack gap="$3">
          <H2 tt={'uppercase'}>Your verified tags</H2>
          <Paragraph
            fontSize={'$5'}
            color={'$lightGrayTextField'}
            $theme-light={{ color: '$darkGrayTextField' }}
          >
            Own your identity on Send. Register up to 5 verified tags and make them yours.
          </Paragraph>
        </YStack>
        <SendtagList
          allTags={confirmedTags}
          confirmedTags={confirmedTags}
          onUpdateMainTag={handleUpdateMainTag}
          isUpdating={updateMainTag.isPending}
          mainTagId={sendAccount?.main_tag_id ?? undefined}
        />
        <Paragraph fontSize={'$7'} fontWeight={'500'}>
          Registered [ {`${confirmedTags?.length || 0}/${maxNumSendTags}`} ]
        </Paragraph>
      </YStack>
      <AddNewTagButton tags={confirmedTags} />
    </YStack>
  )
}

function SendtagList({
  allTags,
  onUpdateMainTag,
  isUpdating,
  mainTagId,
}: {
  allTags: Tables<'tags'>[] | undefined
  confirmedTags?: Tables<'tags'>[]
  onUpdateMainTag: (tagId: number) => void
  isUpdating?: boolean
  mainTagId?: number
}) {
  const { push } = useRouter()
  const nextTagIndex = allTags?.findIndex((tag) => !tag)

  if (!allTags?.length) {
    return null
  }

  // Sort tags to put main tag first
  const sortedTags = [...(allTags || [])].sort((a, b) => {
    if (a?.id === mainTagId) return -1
    if (b?.id === mainTagId) return 1
    return 0
  })

  return (
    <YStack gap="$5">
      {sortedTags.map((tag, i) => {
        if (!tag && i === nextTagIndex) {
          return (
            <Button
              key="%add_tag_button"
              onPress={() => push('/account/sendtag/checkout')}
              w={200}
              h={54}
              br={12}
              bc={'$primary'}
              p={0}
              display="flex"
              jc="center"
              ai="center"
              icon={<IconPlus color={'black'} />}
            >
              <ButtonText fontSize={'$4'} fontWeight={'500'} fontFamily={'$mono'} theme="green">
                Add Tag
              </ButtonText>
            </Button>
          )
        }
        if (!tag) return null

        return (
          <TagItem
            key={tag.name || `%tag_${i}`}
            tag={tag}
            isMainTag={tag.id === mainTagId}
            onUpdateMainTag={onUpdateMainTag}
            isUpdating={isUpdating && tag.id === mainTagId}
          />
        )
      })}
    </YStack>
  )
}

function TagItem({
  tag,
  isMainTag,
  onUpdateMainTag,
  isUpdating,
}: {
  tag?: Tables<'tags'>
  isMainTag?: boolean
  onUpdateMainTag: (tagId: number) => void
  isUpdating?: boolean
}) {
  const [openMainDialog, setOpenMainDialog] = useState(false)
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false)
  const queryClient = useQueryClient()
  const toast = useToastController()

  const deleteTag = api.tag.delete.useMutation({
    onMutate: async ({ tagId }) => {
      console.log('Starting delete mutation for tag:', tagId)

      // Cancel any outgoing refetches for both queries
      await Promise.all([
        queryClient.cancelQueries({ queryKey: ['user'] }),
        queryClient.cancelQueries({ queryKey: ['tags'] }),
      ])

      // Snapshot the previous values
      const previousUser = queryClient.getQueryData(['user'])
      const previousTags = queryClient.getQueryData(['tags'])

      return { previousUser, previousTags }
    },

    onError: (err, variables, context) => {
      console.error('Delete tag error:', err)
      if (context?.previousUser) {
        queryClient.setQueryData(['user'], context.previousUser)
      }
      if (context?.previousTags) {
        queryClient.setQueryData(['tags'], context.previousTags)
      }
      toast.show('Failed to delete tag', { type: 'error' })
    },

    onSuccess: async () => {
      console.log('Tag deleted successfully')

      await Promise.all([
        queryClient.refetchQueries({ queryKey: ['user'], exact: true }),
        queryClient.refetchQueries({ queryKey: ['tags'], exact: true }),
        queryClient.refetchQueries({ queryKey: [useSendAccount.queryKey], exact: true }),
      ])

      toast.show('Tag deleted successfully', { type: 'success' })

      setOpenDeleteDialog(false)
    },
  })

  if (tag === undefined) return null

  return (
    <>
      <ListItem
        h={54}
        br={12}
        w="fit-content"
        bc="$color2"
        px="$4"
        pressStyle={{
          scale: 0.98,
          opacity: 0.95,
          backgroundColor: '$color3',
        }}
        animation="quick"
        hoverStyle={{
          cursor: !isMainTag && !isUpdating ? 'pointer' : undefined,
          backgroundColor: '$color3',
        }}
        onPress={async () => {
          if (!isMainTag && !isUpdating && !deleteTag.isPending) {
            setOpenMainDialog(true)
          }
        }}
        aria-label={`Tag ${tag.name}${isMainTag ? ' (Main)' : ''}`}
      >
        <XStack gap="$4" ai="center" jc="space-between">
          <YStack>
            <Text
              color="$color12"
              ff="$mono"
              fontSize="$6"
              fontWeight="400"
              opacity={isMainTag ? 1 : 0.9}
              pb="$1"
            >
              /{tag.name}
            </Text>
            {isMainTag && (
              <XStack
                position="absolute"
                bottom={-2}
                left={0}
                right={0}
                height={2}
                backgroundColor="$primary"
                opacity={0.9}
                br="$1"
              />
            )}
          </YStack>
          {!isMainTag && (
            <Button
              size="$2"
              theme="red_Button"
              icon={<Trash2 size={14} color="$red10Light" />}
              onPress={(e) => {
                e.stopPropagation()
                setOpenDeleteDialog(true)
              }}
              disabled={isUpdating || deleteTag.isPending}
              pressStyle={{
                scale: 0.95,
                opacity: 0.9,
              }}
              hoverStyle={{
                backgroundColor: '$red2Light',
              }}
              backgroundColor="transparent"
            />
          )}
        </XStack>
      </ListItem>

      <AlertDialog open={openMainDialog} onOpenChange={setOpenMainDialog}>
        <AlertDialog.Portal>
          <AlertDialog.Overlay
            key="overlay"
            animation="quick"
            o={0.5}
            enterStyle={{ o: 0 }}
            exitStyle={{ o: 0 }}
          />
          <AlertDialog.Content
            bordered
            elevate
            key="content"
            w="90%"
            maw={360}
            p="$5"
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
          >
            <YStack space="$4">
              <AlertDialog.Title>Set Main Tag</AlertDialog.Title>

              <AlertDialog.Description asChild>
                <Stack>
                  <Text>
                    Do you want to set{' '}
                    <Text fontWeight="bold" theme="alt2">
                      {tag.name}
                    </Text>{' '}
                    as your main tag? This will be your primary identifier for receiving payments.
                  </Text>
                </Stack>
              </AlertDialog.Description>

              <XStack space="$3" jc="flex-end" pt="$2">
                <Button chromeless onPress={() => setOpenMainDialog(false)} disabled={isUpdating}>
                  Cancel
                </Button>
                <Button
                  theme="active"
                  backgroundColor="$primary"
                  onPress={async () => {
                    if (tag.id) {
                      await onUpdateMainTag(tag.id)
                      setOpenMainDialog(false)
                    }
                  }}
                  disabled={isUpdating}
                  iconAfter={isUpdating ? <Spinner /> : undefined}
                >
                  {isUpdating ? 'Setting...' : 'Set as main Sendtag'}
                </Button>
              </XStack>
            </YStack>
          </AlertDialog.Content>
        </AlertDialog.Portal>
      </AlertDialog>

      <AlertDialog open={openDeleteDialog} onOpenChange={setOpenDeleteDialog}>
        <AlertDialog.Portal>
          <AlertDialog.Overlay
            key="overlay"
            animation="quick"
            o={0.5}
            enterStyle={{ o: 0 }}
            exitStyle={{ o: 0 }}
          />
          <AlertDialog.Content
            bordered
            elevate
            key="content"
            w="90%"
            maw={360}
            p="$5"
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
          >
            <YStack space="$4">
              <AlertDialog.Title>Delete Tag</AlertDialog.Title>

              <AlertDialog.Description asChild>
                <Stack space="$2">
                  <Stack>
                    <Text>
                      Are you sure you want to delete{' '}
                      <Text fontWeight="bold" theme="alt2">
                        {tag.name}
                      </Text>
                      ?
                    </Text>
                  </Stack>
                  <Text>
                    This action cannot be undone and the tag will become available for others to
                    purchase.
                  </Text>
                </Stack>
              </AlertDialog.Description>

              <XStack space="$3" jc="flex-end" pt="$2">
                <Button
                  chromeless
                  onPress={() => setOpenDeleteDialog(false)}
                  disabled={deleteTag.isPending}
                >
                  Cancel
                </Button>
                <Button
                  theme="red"
                  onPress={async () => {
                    if (tag.id) {
                      try {
                        console.log('Attempting to delete tag:', tag.id)
                        await deleteTag.mutateAsync({ tagId: tag.id })
                        // Dialog will be closed in onSuccess callback
                      } catch (error) {
                        console.error('Error in delete handler:', error)
                      }
                    }
                  }}
                  disabled={deleteTag.isPending}
                  iconAfter={deleteTag.isPending ? <Spinner /> : undefined}
                >
                  {deleteTag.isPending ? 'Deleting...' : 'Delete Tag'}
                </Button>
              </XStack>
            </YStack>
          </AlertDialog.Content>
        </AlertDialog.Portal>
      </AlertDialog>
    </>
  )
}

function AddNewTagButton({ tags }: { tags?: Tables<'tags'>[] }) {
  const { push } = useRouter()

  if (tags && tags.length >= maxNumSendTags) {
    return null
  }

  return (
    <Button
      onPress={() => push('/account/sendtag/add')}
      w={200}
      h={54}
      br={12}
      bc={'$primary'}
      p={0}
      display="flex"
      jc="center"
      ai="center"
      icon={<IconPlus color={'black'} />}
    >
      <ButtonText fontSize={'$4'} fontWeight={'500'} fontFamily={'$mono'} theme="green">
        Add Tag
      </ButtonText>
    </Button>
  )
}
