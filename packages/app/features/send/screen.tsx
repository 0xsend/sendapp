import type { Functions } from '@my/supabase/database.types'
import {
  Anchor,
  AnimatePresence,
  Avatar,
  Button,
  Fade,
  H4,
  Label,
  LazyMount,
  LinkableAvatar,
  Paragraph,
  Shimmer,
  Spinner,
  Text,
  useAppToast,
  XStack,
  YStack,
  type YStackProps,
} from '@my/ui'
import Search from './components/SearchBarSend'
import { TagSearchProvider, useTagSearch } from 'app/provider/tag-search'
import { useRootScreenParams, useSendScreenParams } from 'app/routers/params'
import { useProfileLookup } from 'app/utils/useProfileLookup'
import { startTransition, useDeferredValue, useEffect, useState } from 'react'
import { SendAmountForm } from './SendAmountForm'
import { type Address, isAddress } from 'viem'
import { useRouter } from 'solito/router'
import { IconAccount } from 'app/components/icons'
import { shorten } from 'app/utils/strings'
import { SendSuggestions } from 'app/features/send/suggestions/SendSuggestions'
import { Keyboard, Platform } from 'react-native'
import { SendChat } from './components/SendChat'
import { useTranslation } from 'react-i18next'

export const SendScreen = () => {
  const [{ recipient, idType }] = useSendScreenParams()
  const {
    data: profile,
    isLoading: isLoadingRecipient,
    error: errorProfileLookup,
  } = useProfileLookup(idType ?? 'tag', recipient ?? '')
  const [{ search }] = useRootScreenParams()
  const { t } = useTranslation('send')

  // to avoid flickering
  const deferredIsLoadingRecipient = useDeferredValue(isLoadingRecipient)
  const finalIsLoading = isLoadingRecipient && deferredIsLoadingRecipient

  // const router = useRouter()
  const [queryParams, setQueryParams] = useSendScreenParams()

  const [open, setOpen] = useState(false)

  useEffect(() => {
    if (profile?.address && Number(queryParams.m) === 1) {
      Keyboard.dismiss()
      startTransition(() => {
        setOpen(true)
      })
    } else {
      setOpen(false)
    }
  }, [profile, queryParams.m])

  if (errorProfileLookup) throw new Error(errorProfileLookup.message)

  if (idType === 'address' && isAddress(recipient as Address)) {
    return <SendAmountForm />
  }

  if (profile && !profile.address) return <NoSendAccount profile={profile} />

  // if (!gtLg || !profile || isLoadingRecipient)
  return (
    <TagSearchProvider>
      <YStack
        pe={isLoadingRecipient ? 'none' : 'auto'}
        o={finalIsLoading ? 0.5 : 1}
        width="100%"
        pb="$4"
        gap="$6"
        $lg={{ pt: '$3' }}
        $platform-web={{
          transition: 'opacity 200ms linear',
        }}
        $platform-native={{
          animation: '200ms',
          animateOnly: ['opacity'],
        }}
      >
        <YStack width="100%" gap="$1.5" $gtSm={{ gap: '$2.5' }}>
          <Search placeholder={t('search.placeholder')} autoFocus={Platform.OS === 'web'} />
        </YStack>
        {!search && <SendSuggestions />}
        {/* {!gtLg && ( */}
        <LazyMount when={open}>
          <SendChat
            open={open}
            onOpenChange={(val) => {
              setOpen(val)
              setQueryParams(
                {
                  ...queryParams,
                  m: val ? 1 : 0,
                },
                { webBehavior: 'replace' }
              )
            }}
          />
        </LazyMount>
        {/* )} */}
        <SendSearchBody />
      </YStack>
    </TagSearchProvider>
  )

  // if (gtLg) {
  //   return <SendAmountForm />
  // }
}

function SendSearchBody() {
  const { isLoading, error } = useTagSearch()
  const { t } = useTranslation('send')

  return (
    <AnimatePresence>
      {isLoading && (
        <YStack key="loading" gap="$4" mb="$4">
          <Shimmer
            ov="hidden"
            scope="local"
            br="$4"
            h={80}
            w={600}
            $sm={{
              w: '100%',
            }}
            maw="100%"
            componentName="Card"
            bg="$color1"
            $theme-light={{ bg: '$gray1' }}
          />
        </YStack>
      )}
      {error && (
        <YStack key="red" gap="$4" mb="$4">
          <H4 theme={'alt2'}>{t('search.errorHeading')}</H4>
          <Text>{error.message}</Text>
        </YStack>
      )}
      {!isLoading && !error && <Search.Results />}
    </AnimatePresence>
  )
}

export function SendRecipient({ ...props }: YStackProps) {
  const [queryParams] = useSendScreenParams()
  const { recipient, idType } = queryParams
  const router = useRouter()
  const { data: profile, isLoading, error } = useProfileLookup(idType ?? 'tag', recipient ?? '')
  const href = profile ? `/profile/${profile?.sendid}` : ''
  const { t } = useTranslation('send')

  if (isLoading) return <Spinner size="large" />
  if (error) throw new Error(error.message)

  return (
    <YStack gap="$2.5" {...props}>
      <XStack jc="space-between" ai="center" gap="$3">
        <Label
          fontWeight="500"
          fontSize={'$5'}
          textTransform="uppercase"
          $theme-dark={{ col: '$gray8Light' }}
        >
          {t('recipient.label')}
        </Label>
        <Button
          bc="transparent"
          chromeless
          hoverStyle={{ bc: 'transparent' }}
          pressStyle={{ bc: 'transparent' }}
          focusStyle={{ bc: 'transparent' }}
          onPress={() =>
            router.push({
              pathname: '/send',
              query: { sendToken: queryParams.sendToken, amount: queryParams.amount },
            })
          }
        >
          <Button.Text $theme-dark={{ col: '$primary' }}>{t('recipient.edit')}</Button.Text>
        </Button>
      </XStack>
      <XStack
        ai="center"
        gap="$3"
        bc="$metalTouch"
        p="$2"
        br="$3"
        $theme-light={{ bc: '$gray3Light' }}
      >
        <LinkableAvatar size="$4.5" br="$3" href={href}>
          {Platform.OS === 'android' && !profile?.avatar_url ? (
            <IconAccount size="$4.5" color="$olive" />
          ) : (
            <>
              <Avatar.Image src={profile?.avatar_url ?? ''} />
              <Avatar.Fallback jc="center">
                <IconAccount size="$4.5" color="$olive" />
              </Avatar.Fallback>
            </>
          )}
        </LinkableAvatar>
        <YStack gap="$1.5">
          <Paragraph fontSize="$4" fontWeight="500" color="$color12">
            {profile?.name}
          </Paragraph>
          <Paragraph
            fontFamily="$mono"
            fontSize="$4"
            fontWeight="400"
            lineHeight="$1"
            color="$color11"
          >
            {(() => {
              switch (true) {
                case idType === 'address':
                  return shorten(recipient, 5, 4)
                case !!profile?.tag:
                  return `/${profile?.tag}`
                default:
                  return `#${profile?.sendid}`
              }
            })()}
          </Paragraph>
        </YStack>
      </XStack>
    </YStack>
  )
}

function NoSendAccount({ profile }: { profile: Functions<'profile_lookup'>[number] }) {
  const toast = useAppToast()
  const [clicked, setClicked] = useState(false)
  const { t } = useTranslation('send')
  return (
    <YStack testID="NoSendAccount" gap="$4" mb="$4" maw={600} $lg={{ mx: 'auto' }} width={'100%'}>
      <SendRecipient width={'100%'} />
      <H4 theme={'alt2'} color="$olive">
        {t('noAccount.title')}
      </H4>
      <Anchor
        testID="NoSendAccountLink"
        href={`/profile/${profile.sendid}`}
        textDecorationLine="none"
        color="$color12"
      >
        <Text fontWeight="bold" display="flex" color="$color12">
          {(() => {
            if (profile.tag) return `/${profile.tag}`
            if (profile.name) return profile.name
            return `#${profile.sendid}`
          })()}
        </Text>
        <Text display="flex" color="$color12">
          {' '}
          {t('noAccount.description')}
        </Text>
      </Anchor>

      <Button
        mx="auto"
        miw="$16"
        maw="$20"
        disabled={clicked}
        onPress={() => {
          setClicked(true)
          console.error('TODO: create send account')
          toast.show(t('noAccount.toast'))
        }}
      >
        {t('noAccount.cta')}
      </Button>
      {clicked && (
        <Fade>
          <Paragraph width={'100%'} textAlign="center" color="$color12">
            <Text>{t('noAccount.banner')}</Text>
          </Paragraph>
        </Fade>
      )}
    </YStack>
  )
}
