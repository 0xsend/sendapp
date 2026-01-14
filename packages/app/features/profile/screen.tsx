// External libs & UI
import { ChevronRight, Pencil, Upload, UserPlus } from '@tamagui/lucide-icons'
import { type PropsWithChildren, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  Anchor,
  Avatar,
  BlurStack,
  Button,
  Card,
  H3,
  Image,
  Paragraph,
  Spinner,
  Stack,
  Text,
  useMedia,
  useThemeName,
  XStack,
  YStack,
  LazyMount,
  useAppToast,
} from '@my/ui'

// Internal
import { useProfileLookup } from 'app/utils/useProfileLookup'
import { useContactBySendId } from 'app/features/contacts/hooks/useContactBySendId'
import {
  useAddContactByLookup,
  useToggleContactFavorite,
} from 'app/features/contacts/hooks/useContactMutation'
import { useContactLabels } from 'app/features/contacts/hooks/useContactLabels'
import { LabelChip } from 'app/features/contacts/components/LabelChip'
import { ContactDetailSheet } from 'app/features/contacts/components/ContactDetailSheet'
import { getProfileDisplayName } from 'app/features/contacts/utils/getContactDisplayName'
import type { ContactView } from 'app/features/contacts/types'
import { IconHeart, IconHeartOutline } from 'app/components/icons'
import { useProfileScreenParams, useSendScreenParams } from 'app/routers/params'
import { IconAccount, IconLinkInBio, IconBadgeCheckSolid } from 'app/components/icons'
import { ShareOtherProfileDialog } from './components/ShareOtherProfileDialog'
import type { Functions } from '@my/supabase/database.types'
import { useTokenPrices } from 'app/utils/useTokenPrices'
import { baseMainnet, sendTokenAddress } from '@my/wagmi'
import { parseUnits } from 'viem'
import { type allCoinsDict, coinsDict } from 'app/data/coins'
import type { TokenPriceData } from 'app/utils/useTokenPrices'
import { IconFYSI } from 'app/components/icons/IconFYSI'
import { useHoverStyles } from 'app/utils/useHoverStyles'
import { Linking, Platform, Pressable } from 'react-native'
import ProfileSendButton from 'app/features/profile/ProfileSendButton'
import ViewHistoryButton from 'app/features/profile/ViewHistoryButton'
import VibeButton from 'app/features/profile/VibeButton'
import { SendChat } from '../send/components/SendChat'

interface ProfileScreenProps {
  sendid?: number | null
}

export function ProfileScreen({ sendid: propSendid }: ProfileScreenProps) {
  const media = useMedia()
  const toast = useAppToast()
  const [{ sendid: paramSendid }] = useProfileScreenParams()
  const [sendParams, setSendParams] = useSendScreenParams()
  const [sendChatOpen, setSendChatOpen] = useState(false)
  const prevSendChatOpenRef = useRef(sendChatOpen)

  useEffect(() => {
    if (sendParams.idType && sendParams.recipient) {
      setSendChatOpen(true)
    }
  }, [sendParams.idType, sendParams.recipient])

  // Clear params only when modal is actively closed (transition from open to closed)
  // biome-ignore lint/correctness/useExhaustiveDependencies: only trigger when sendChatOpen changes
  useEffect(() => {
    const wasOpen = prevSendChatOpenRef.current
    prevSendChatOpenRef.current = sendChatOpen

    // Only clear params when transitioning from open to closed, not on initial mount
    if (wasOpen && !sendChatOpen) {
      setSendParams({
        idType: undefined,
        recipient: undefined,
        note: undefined,
        amount: sendParams.amount,
        sendToken: sendParams.sendToken,
      })
    }
  }, [sendChatOpen])

  const otherUserId = propSendid || Number(paramSendid)
  const [shareDialogOpen, setShareDialogOpen] = useState(false)
  const [contactSheetOpen, setContactSheetOpen] = useState(false)
  const isDark = useThemeName()?.startsWith('dark')
  const {
    data: otherUserProfile,
    isLoading: isLoadingProfile,
    error,
  } = useProfileLookup('sendid', otherUserId?.toString() || '')

  // Contact state
  const { data: existingContact, refetch: refetchContact } = useContactBySendId(otherUserId)
  const isContact = !!existingContact
  const isFavorite = existingContact?.is_favorite ?? false

  // Fetch all labels for displaying contact labels
  const { data: allLabels } = useContactLabels()

  // Get the labels assigned to this contact
  const contactLabels = useMemo(() => {
    if (!allLabels || !existingContact?.label_ids) return []
    const labelSet = new Set(existingContact.label_ids)
    return allLabels.filter((label) => labelSet.has(label.id))
  }, [allLabels, existingContact?.label_ids])

  // Display name with nickname support
  // Merge contact data with fresh profile lookup data for fallback
  // Priority: custom_name > profile_name > main_tag_name > send_id
  const displayNameParts = useMemo(() => {
    if (!existingContact) return null
    return getProfileDisplayName({
      custom_name: existingContact.custom_name,
      // Use contact data first, fall back to fresh profile lookup data
      profile_name: existingContact.profile_name ?? otherUserProfile?.name ?? null,
      main_tag_name: existingContact.main_tag_name ?? otherUserProfile?.main_tag_name ?? null,
      send_id: existingContact.send_id ?? otherUserProfile?.sendid ?? null,
    })
  }, [existingContact, otherUserProfile])

  // Contact mutations
  const { mutate: addContact, isPending: isAddingContact } = useAddContactByLookup()
  const { mutate: toggleFavorite, isPending: isTogglingFavorite } = useToggleContactFavorite()

  // Handle add contact button
  const handleAddContact = useCallback(() => {
    if (!otherUserProfile?.sendid) return

    const identifier = otherUserProfile.main_tag_name ?? otherUserProfile.sendid?.toString() ?? ''
    const lookupType = otherUserProfile.main_tag_name ? 'tag' : 'sendid'

    addContact(
      {
        identifier,
        lookupType: lookupType as 'tag' | 'sendid',
      },
      {
        onSuccess: () => {
          toast.show('Contact added')
          refetchContact()
        },
        onError: (err) => {
          toast.error(err.message)
        },
      }
    )
  }, [otherUserProfile, addContact, toast, refetchContact])

  // Handle favorite button
  const handleToggleFavorite = useCallback(() => {
    if (!existingContact?.contact_id) return

    toggleFavorite(
      { contactId: existingContact.contact_id },
      {
        onSuccess: () => {
          toast.show(isFavorite ? 'Removed from favorites' : 'Added to favorites')
          refetchContact()
        },
        onError: (err) => {
          toast.error(err.message)
        },
      }
    )
  }, [existingContact, isFavorite, toggleFavorite, toast, refetchContact])

  const imagePlaceholder = useRef(
    `https://ghassets.send.app/app_images/auth_image_${Math.floor(Math.random() * 3) + 1}.jpg`
  )

  const {
    query: { data: tokenPrices, isLoading: isLoadingTokenPrices },
  } = useTokenPrices()

  const isLoading = isLoadingProfile || isLoadingTokenPrices

  const openShareMenu = (): void => {
    setShareDialogOpen(true)
  }

  if (isLoading) {
    return (
      <Stack w="100%" h="100%" jc={'center'} ai={'center'} f={1} gap="$6">
        <Spinner size="large" color="$primary" />
      </Stack>
    )
  }

  if (error || !otherUserProfile) {
    return (
      <Stack w="100%" h="100%" jc={'center'} ai={'center'} f={1} gap="$6">
        <Text theme="red" color={'$color8'}>
          {error?.message || 'Profile not found'}
        </Text>
      </Stack>
    )
  }

  return (
    <YStack gap="$4" ai="center" w="100%" maw={1024}>
      <Card elevation={0} w="100%" h={200} position="relative" br="$5">
        <Card.Background br="$5">
          <BlurStack
            fullscreen
            intensity={otherUserProfile?.banner_url ? 0 : 30}
            zIndex={100}
            tint={isDark ? 'dark' : 'light'}
            overflow="hidden"
          />
          <Image
            source={{
              uri:
                otherUserProfile?.banner_url ??
                otherUserProfile?.avatar_url ??
                imagePlaceholder.current,
              width: 428,
              height: 200,
            }}
            h="100%"
            w="100%"
            objectFit="cover"
            br="$5"
          />
        </Card.Background>
      </Card>
      <YStack gap="$4" flexDirection={media.gtMd ? 'row' : 'column'} w="100%">
        <YStack
          gap="$4"
          maw={509}
          w="100%"
          $platform-web={{
            f: media.gtMd ? 1 : undefined,
            als: media.gtMd ? 'flex-start' : 'center',
            jc: media.gtMd ? 'flex-start' : 'center',
          }}
        >
          {media.gtMd ? (
            <Paragraph color="$color12" fontSize="$6" fontWeight="600">
              About
            </Paragraph>
          ) : null}
          <Card gap="$4" size={media.gtMd ? '$7' : '$5'} padded elevation={1}>
            <XStack jc="space-between" w="100%">
              {Platform.OS === 'android' && !otherUserProfile?.avatar_url ? (
                <XStack
                  w={media.gtMd ? 80 : 64}
                  h={media.gtMd ? 80 : 64}
                  jc={'center'}
                  ai={'center'}
                  br={'$3'}
                  bc={isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'}
                >
                  <IconAccount color="$color12" size={'100%'} />
                </XStack>
              ) : (
                <Avatar
                  size={media.gtMd ? 80 : 64}
                  aspectRatio={1}
                  objectFit="cover"
                  br={'$3'}
                  bc={isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'}
                  als="center"
                >
                  <Avatar.Image src={otherUserProfile?.avatar_url ?? undefined} objectFit="cover" />
                  <Avatar.Fallback f={1} jc={'center'} ai={'center'}>
                    <IconAccount color="$color12" size={'100%'} />
                  </Avatar.Fallback>
                </Avatar>
              )}
              <YStack px="$4" gap="$3" jc="space-around" f={1} als="center">
                <XStack ai="center" gap="$2" flexWrap="wrap">
                  {/* Show nickname (Profile Name) format when contact has custom_name */}
                  {displayNameParts?.primary ? (
                    <>
                      <H3 lineHeight={32} color="$color12" testID="profileName">
                        {displayNameParts.primary}
                      </H3>
                      {displayNameParts.secondary && (
                        <Text fontSize="$5" color="$color10">
                          ({displayNameParts.secondary})
                        </Text>
                      )}
                    </>
                  ) : (
                    <H3 lineHeight={32} color="$color12" testID="profileName">
                      {otherUserProfile?.name ?? '---'}
                    </H3>
                  )}
                  {otherUserProfile?.is_verified ? (
                    <IconBadgeCheckSolid
                      size={'$1.5'}
                      mih={'$1.5'}
                      miw={'$1.5'}
                      color={'$primary'}
                      $theme-light={{ color: '$color12' }}
                    />
                  ) : null}
                </XStack>
                <ViewHistoryButton sendId={otherUserProfile?.sendid} />
              </YStack>
            </XStack>
            <XStack gap="$2" flexWrap="wrap" w="100%">
              {otherUserProfile?.all_tags?.map((tag) => {
                const isMainTag = tag === otherUserProfile?.main_tag_name
                return (
                  <XStack
                    key={tag}
                    px={8}
                    py={4}
                    bc={isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'}
                    borderRadius={4}
                    alignSelf="flex-start"
                    {...(isMainTag && {
                      borderWidth: 1,
                    })}
                    borderColor={isMainTag ? '$primary' : 'transparent'}
                    $theme-light={{
                      borderColor: isMainTag ? '$color12' : 'transparent',
                    }}
                  >
                    <Paragraph color="$color12" fontSize="$3" fontWeight="400">
                      /{tag}
                    </Paragraph>
                  </XStack>
                )
              })}
            </XStack>

            {/* Contact labels - show below sendtags, above Send button */}
            {isContact && contactLabels.length > 0 && (
              <XStack gap="$2" flexWrap="wrap" w="100%">
                {contactLabels.map((label) => (
                  <LabelChip key={label.id} label={label} />
                ))}
              </XStack>
            )}

            <Paragraph color="$color12" fontSize="$4" fontWeight="400">
              {otherUserProfile?.about}
            </Paragraph>
            <XStack w="100%" gap="$4">
              <ProfileSendButton sendId={otherUserProfile?.sendid} />
              {/* Add contact / favorite / edit buttons */}
              {isContact ? (
                <>
                  <Button
                    testID="profileToggleFavoriteButton"
                    aspectRatio={1}
                    p={0}
                    br="$4"
                    bc={isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'}
                    onPress={handleToggleFavorite}
                    disabled={isTogglingFavorite}
                    icon={
                      isTogglingFavorite ? (
                        <Spinner size="small" />
                      ) : isFavorite ? (
                        <IconHeart size="$1" color="$red9" />
                      ) : (
                        <IconHeartOutline size="$1" color="$color12" />
                      )
                    }
                  />
                  <Button
                    testID="profileEditContactButton"
                    aspectRatio={1}
                    p={0}
                    br="$4"
                    bc={isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'}
                    onPress={() => setContactSheetOpen(true)}
                    icon={<Pencil size="$1" color="$color12" />}
                  />
                </>
              ) : (
                <Button
                  testID="profileAddContactButton"
                  aspectRatio={1}
                  p={0}
                  br="$4"
                  bc={isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'}
                  onPress={handleAddContact}
                  disabled={isAddingContact}
                  icon={
                    isAddingContact ? (
                      <Spinner size="small" />
                    ) : (
                      <UserPlus size="$1" color="$color12" />
                    )
                  }
                />
              )}
              <Button
                aspectRatio={1}
                p={0}
                br="$4"
                bc={isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'}
                onPress={openShareMenu}
                icon={<Upload size="$1" color="$color12" padding="$1" />}
              />
            </XStack>
          </Card>
        </YStack>
        <YStack
          maw={509}
          gap="$4"
          width={'100%'}
          $platform-web={{
            f: media.gtMd ? 1 : undefined,
            als: media.gtMd ? 'flex-start' : 'center',
            jc: media.gtMd ? 'flex-start' : 'center',
          }}
        >
          {otherUserProfile?.links_in_bio ? (
            <YStack gap="$4" w="100%">
              <Paragraph color="$color12" fontSize="$6" fontWeight="600">
                Let&apos;s Connect
              </Paragraph>
              <LinksInBio profile={otherUserProfile} />
            </YStack>
          ) : null}
          <YStack gap="$4" w="100%">
            <Paragraph color="$color12" fontSize="$6" fontWeight="600">
              Send Vibes
            </Paragraph>

            <Vibes profile={otherUserProfile} tokenPrices={tokenPrices} />
          </YStack>
        </YStack>

        {otherUserProfile ? (
          <ShareOtherProfileDialog
            isOpen={shareDialogOpen}
            onClose={() => setShareDialogOpen(false)}
            profile={otherUserProfile}
          />
        ) : null}
      </YStack>
      <LazyMount when={sendChatOpen}>
        <SendChat open={sendChatOpen} onOpenChange={setSendChatOpen} />
      </LazyMount>
      {existingContact && (
        <LazyMount when={contactSheetOpen}>
          <ContactDetailSheet
            contact={existingContact as ContactView}
            open={contactSheetOpen}
            onOpenChange={setContactSheetOpen}
            onUpdate={refetchContact}
            hideNavButtons
          />
        </LazyMount>
      )}
    </YStack>
  )
}

const Vibe = ({
  amount,
  sendToken,
  note,
  children,
  profile,
}: {
  amount: bigint
  sendToken: keyof allCoinsDict
  note: string
  children: React.ReactNode
  profile: Functions<'profile_lookup'>[number]
}) => {
  const hoverStyle = useHoverStyles()
  return (
    <VibeButton
      href={{
        pathname: '/send',
        query: {
          recipient: profile?.main_tag_name ? profile?.main_tag_name : (profile?.sendid ?? ''),
          idType: profile?.main_tag_name ? 'tag' : 'sendid',
          sendToken,
          amount: amount.toString(),
          note,
        },
      }}
      bc="$color1"
      hoverStyle={hoverStyle}
    >
      {children}
    </VibeButton>
  )
}

const Vibes = ({
  profile,
  tokenPrices,
}: {
  profile: Functions<'profile_lookup'>[number]
  tokenPrices: TokenPriceData | undefined
}) => {
  const media = useMedia()
  const dollarToTokenAmount = ({
    amount,
    tokenPrice,
    token,
  }: {
    amount: number
    tokenPrice: number
    token: keyof allCoinsDict
  }) => {
    const coinData = coinsDict[token]

    if (tokenPrice <= 0 || !coinData) {
      return 0n
    }

    const tokenAmount = amount / tokenPrice
    const decimals = coinData.decimals || 18

    // Round to 2 decimal places
    const roundedTokenAmount = Math.floor(tokenAmount * 100) / 100

    // Convert to the proper bigint representation
    // For example: 250.00 SEND tokens = 250 * 10^18 = 250000000000000000000n
    return parseUnits(roundedTokenAmount.toFixed(2), decimals)
  }

  const isDark = useThemeName()?.startsWith('dark')
  const sendTokenPrice = tokenPrices?.[sendTokenAddress[baseMainnet.id]] ?? 0
  return (
    // @ts-expect-error - overflowX is needed for X-axis specific scroll behavior
    <XStack jc="flex-start" gap={'$2'} p={2} overflowX={media.gtMd ? 'visible' : 'scroll'}>
      <Vibe
        amount={dollarToTokenAmount({
          amount: 1,
          tokenPrice: sendTokenPrice,
          token: sendTokenAddress[baseMainnet.id],
        })}
        sendToken={sendTokenAddress[baseMainnet.id]}
        note="😊"
        profile={profile}
      >
        <VibeButtonText>😊</VibeButtonText>
        <Paragraph size={'$3'}>$1</Paragraph>
      </Vibe>
      <Vibe
        amount={dollarToTokenAmount({
          amount: 2,
          tokenPrice: sendTokenPrice,
          token: sendTokenAddress[baseMainnet.id],
        })}
        sendToken={sendTokenAddress[baseMainnet.id]}
        note="🔥"
        profile={profile}
      >
        <VibeButtonText>🔥</VibeButtonText>
        <Paragraph size={'$3'}>$2</Paragraph>
      </Vibe>
      <Vibe
        amount={dollarToTokenAmount({
          amount: 3,
          tokenPrice: sendTokenPrice,
          token: sendTokenAddress[baseMainnet.id],
        })}
        sendToken={sendTokenAddress[baseMainnet.id]}
        note="💯"
        profile={profile}
      >
        <VibeButtonText>💯</VibeButtonText>
        <Paragraph size={'$3'}>$3</Paragraph>
      </Vibe>
      <Vibe
        amount={dollarToTokenAmount({
          amount: 4,
          tokenPrice: sendTokenPrice,
          token: sendTokenAddress[baseMainnet.id],
        })}
        sendToken={sendTokenAddress[baseMainnet.id]}
        note="🚀"
        profile={profile}
      >
        <VibeButtonText>🚀</VibeButtonText>
        <Paragraph size={'$3'}>$4</Paragraph>
      </Vibe>
      <Vibe
        amount={dollarToTokenAmount({
          amount: 5,
          tokenPrice: sendTokenPrice,
          token: sendTokenAddress[baseMainnet.id],
        })}
        sendToken={sendTokenAddress[baseMainnet.id]}
        note="FYSI"
        profile={profile}
      >
        <Button.Icon>
          <IconFYSI
            size={(() => {
              if (media.xxs) {
                return '$2'
              }

              return '$3'
            })()}
            color={isDark ? '$primary' : '$color12'}
          />
        </Button.Icon>
        <Paragraph size={'$3'}>$5</Paragraph>
      </Vibe>
    </XStack>
  )
}

const LinksInBio = ({ profile }: { profile: Functions<'profile_lookup'>[number] }) => {
  const media = useMedia()
  return (
    <Card elevation={1} padded size={media.gtMd ? '$7' : '$5'} borderRadius="$6" gap="$4">
      {profile?.links_in_bio?.map((link) => {
        return <LinkInBio link={link} key={`lets-connect-${link.domain}${link.handle}`} />
      })}
    </Card>
  )
}

type ProfileLink = NonNullable<Functions<'profile_lookup'>[number]['links_in_bio']>[number]

const LinkInBio = ({ link }: { link: ProfileLink }) => {
  const theme = useThemeName()
  const isDark = theme?.startsWith('dark')
  const fullUrl = `https://${link.domain}${link.handle}`

  const content = (
    <XStack width="100%" justifyContent="space-between" alignItems="center">
      <XStack gap="$4" alignItems="center">
        <IconLinkInBio domain_name={link.domain_name} size={24} color="$white" />
        <Paragraph size={'$4'} fontWeight={600} color={'$color12'}>
          {link.domain_name}
        </Paragraph>
      </XStack>
      <XStack
        bg={isDark ? 'rgba(255, 255, 255, 0.10)' : 'rgba(0, 0, 0, 0.10)'}
        borderRadius="$3"
        justifyContent="center"
        alignItems="center"
      >
        <ChevronRight size="$1.5" color="$color12" />
      </XStack>
    </XStack>
  )

  if (Platform.OS === 'web') {
    return (
      <Anchor href={fullUrl} target="_blank" width="100%" f={1} textDecorationLine="none">
        {content}
      </Anchor>
    )
  }

  return <Pressable onPress={() => Linking.openURL(fullUrl)}>{content}</Pressable>
}

const VibeButtonText = ({ children }: PropsWithChildren) => {
  const media = useMedia()

  return (
    <Button.Text
      ta={'center'}
      w={'100%'}
      size={(() => {
        if (media.xxs) {
          return '$5'
        }

        if (media.xs) {
          return '$7'
        }

        return '$9'
      })()}
      ellipsizeMode="clip"
    >
      {children}
    </Button.Text>
  )
}
