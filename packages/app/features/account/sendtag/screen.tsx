import type { Tables } from '@my/supabase/database.types'
import {
  Button,
  Dialog,
  Fade,
  H2,
  Paragraph,
  PrimaryButton,
  Sheet,
  Spinner,
  Stack,
  useAppToast,
  XStack,
  YGroup,
  YStack,
} from '@my/ui'
import { IconBadgeCheck, IconPlus, IconSlash, IconX } from 'app/components/icons'
import { maxNumSendTags } from 'app/data/sendtags'
import { useUser } from 'app/utils/useUser'
import { useSendAccount } from 'app/utils/send-accounts'
import { useState } from 'react'
import { Platform } from 'react-native'
import { api } from 'app/utils/api'
import { useLink } from 'solito/link'
import { useHoverStyles } from 'app/utils/useHoverStyles'
import { useThemeName } from 'tamagui'

export function SendTagScreen() {
  const { tags, isLoading } = useUser()
  const { data: sendAccount } = useSendAccount()
  const [mainTagSheetOpen, setMainTagSheetOpen] = useState(false)
  const isFirstSendtagClaimable = Array.isArray(tags) && tags.length === 0
  const confirmedTags = Array.isArray(tags) ? tags.filter((tag) => tag.status === 'confirmed') : []
  const mainTagId = sendAccount?.main_tag_id

  // Sort tags to put main tag first
  const sortedTags = confirmedTags
    ? [...confirmedTags].sort((a, b) => {
        if (a?.id === mainTagId) return -1
        if (b?.id === mainTagId) return 1
        return 0
      })
    : []

  if (isLoading)
    return (
      <Stack w="100%" h="100%" jc={'center'} ai={'center'}>
        <Spinner color="$primary" size="large" />
      </Stack>
    )

  return (
    <YStack
      width={'100%'}
      f={Platform.OS === 'web' ? undefined : 1}
      gap="$5"
      jc={'space-between'}
      $gtLg={{
        width: '50%',
        pb: '$3.5',
      }}
    >
      <YStack gap="$5">
        <YStack gap="$3">
          <H2 tt={'uppercase'}>
            {isFirstSendtagClaimable ? 'Register your first Sendtag' : 'Your verified Sendtags'}
          </H2>
          <Paragraph
            fontSize={'$5'}
            color={'$lightGrayTextField'}
            $theme-light={{ color: '$darkGrayTextField' }}
          >
            Own your identity on Send. Register up to 5 verified tags and make them yours.
          </Paragraph>
        </YStack>
        <Paragraph fontSize={'$7'} fontWeight={'500'} lineHeight={24}>
          Registered [ {`${confirmedTags?.length || 0}/${maxNumSendTags}`} ]
        </Paragraph>
        <SendtagList
          tags={sortedTags}
          mainTagId={mainTagId}
          onMainTagSelect={() => setMainTagSheetOpen(true)}
        />
      </YStack>
      <AddNewTagButton tags={confirmedTags} isFirstSendtagClaimable={isFirstSendtagClaimable} />
      <MainTagSelectionSheet
        open={mainTagSheetOpen}
        onOpenChange={setMainTagSheetOpen}
        tags={sortedTags}
        currentMainTagId={mainTagId}
      />
    </YStack>
  )
}

function AddNewTagButton({
  tags,
  isFirstSendtagClaimable,
}: {
  tags?: Tables<'tags'>[]
  isFirstSendtagClaimable: boolean
}) {
  const linkProps = useLink({
    href: isFirstSendtagClaimable ? '/account/sendtag/first' : '/account/sendtag/add',
  })

  if (tags && tags.length >= maxNumSendTags) {
    return null
  }

  return (
    <PrimaryButton {...linkProps}>
      {!isFirstSendtagClaimable && (
        <PrimaryButton.Icon>
          <IconPlus size={'$1'} color={'$black'} />
        </PrimaryButton.Icon>
      )}
      <PrimaryButton.Text>
        {isFirstSendtagClaimable ? 'register free sendtag' : 'add new'}
      </PrimaryButton.Text>
    </PrimaryButton>
  )
}

function SendtagList({
  tags,
  mainTagId,
  onMainTagSelect,
}: {
  tags?: Tables<'tags'>[]
  mainTagId?: number | null
  onMainTagSelect?: () => void
}) {
  if (!tags || tags.length === 0) {
    return null
  }

  const canChangeMainTag = tags.length > 1

  return (
    <YStack gap="$3">
      <Fade>
        <YGroup
          elevation={'$0.75'}
          bc={'$color1'}
          p={'$2'}
          $gtLg={{ p: '$3.5' }}
          testID={'sendtags-list'}
        >
          {tags.map((tag) => (
            <YGroup.Item key={tag.name}>
              <TagItem tag={tag} isMain={tag.id === mainTagId} />
            </YGroup.Item>
          ))}
        </YGroup>
      </Fade>
      {canChangeMainTag && (
        <Button onPress={onMainTagSelect} br="$4" elevation={'$0.75'}>
          <Button.Text fontSize={'$5'}>Change Main Tag</Button.Text>
        </Button>
      )}
    </YStack>
  )
}

function TagItem({ tag, isMain }: { tag: Tables<'tags'>; isMain?: boolean }) {
  return (
    <XStack jc={'space-between'} ai="center" gap="$2" p="$3.5" br={'$4'} $gtLg={{ p: '$5' }}>
      <XStack width={'75%'}>
        <IconSlash size={'$1.5'} color={'$primary'} $theme-light={{ color: '$color12' }} />
        <Paragraph
          size={'$8'}
          fontWeight={'500'}
          numberOfLines={1}
          testID={`confirmed-tag-${tag.name}`}
          aria-label={`Tag ${tag.name}${isMain ? ' (Main)' : ''}`}
          lineHeight={28}
        >
          {tag.name}
        </Paragraph>
      </XStack>
      {isMain && (
        <Paragraph
          size={'$6'}
          color={'$primary'}
          fontWeight={'600'}
          $theme-light={{ color: '$color12' }}
        >
          Main
        </Paragraph>
      )}
    </XStack>
  )
}

function MainTagSelectionSheet({
  open,
  onOpenChange,
  tags,
  currentMainTagId,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  tags: Tables<'tags'>[]
  currentMainTagId?: number | null
}) {
  const toast = useAppToast()
  const theme = useThemeName()
  const isDark = theme?.startsWith('dark')
  const { updateProfile } = useUser()
  const hoverStyles = useHoverStyles()
  const { refetch: refetchSendAccount, data: sendAccount } = useSendAccount()
  const { mutateAsync: updateMainTag, isPending } = api.sendAccount.updateMainTag.useMutation({
    onSuccess: async () => {
      toast.show('Main tag updated')
      await updateProfile()
      await refetchSendAccount()
      onOpenChange(false)
    },
    onError: (error) => {
      toast.error('Failed to update main tag')
      console.error('Failed to update main tag:', error)
    },
  })

  const handleSelectTag = async (tagId: number) => {
    if (tagId === currentMainTagId || isPending || !sendAccount) return
    await updateMainTag({ tagId, sendAccountId: sendAccount?.id })
  }

  // Shared content component to avoid duplication
  const dialogContent = (
    <>
      <H2 fontSize={'$7'} ta={'center'}>
        Select Main Tag
      </H2>
      <Paragraph ta="center" size="$4" color="$color11">
        Choose which tag appears as your primary identity
      </Paragraph>
      <YStack gap="$2">
        {tags.map((tag) => {
          const isCurrentMain = tag.id === currentMainTagId
          return (
            <Button
              key={tag.id}
              size="$5"
              br="$4"
              theme={isCurrentMain ? 'green' : undefined}
              disabled={isCurrentMain || isPending}
              onPress={() => handleSelectTag(tag.id)}
              hoverStyle={hoverStyles}
              icon={
                isPending ? (
                  <Spinner size="small" color="$color11" />
                ) : (
                  <XStack gap="$3" ai="center" f={1}>
                    <IconSlash
                      size="$1.5"
                      color={isDark ? (isCurrentMain ? '$black' : '$primary') : '$color12'}
                    />
                    <Paragraph
                      size="$5"
                      fontWeight="500"
                      f={1}
                      color={isCurrentMain ? '$black' : '$color12'}
                    >
                      {tag.name}
                    </Paragraph>
                    {isCurrentMain ? (
                      <IconBadgeCheck size="$1" color={isDark ? '$black' : '$color12'} />
                    ) : null}
                  </XStack>
                )
              }
              pressStyle={{ o: 0.8 }}
            />
          )
        })}
      </YStack>
      {isPending && (
        <XStack ai="center" jc="center" gap="$2" mt="$2">
          <Spinner size="small" color="$primary" />
          <Paragraph size="$3" color="$color11">
            Updating main tag...
          </Paragraph>
        </XStack>
      )}
      {Platform.OS === 'web' && (
        <Dialog.Close asChild>
          <Button
            position="absolute"
            top="$3"
            right="$3"
            size="$2"
            circular
            icon={<IconX size={16} color="$color12" />}
          />
        </Dialog.Close>
      )}
    </>
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
            gap="$4"
            width="100%"
            maxWidth={450}
          >
            {dialogContent}
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
      snapPoints={['fit']}
      snapPointsMode="fit"
    >
      <Sheet.Frame key="main-tag-selection-sheet" gap="$4" padding="$4" pb={'$6'}>
        {dialogContent}
      </Sheet.Frame>
      <Sheet.Overlay />
    </Sheet>
  )
}
