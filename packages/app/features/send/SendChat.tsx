import { LegendList } from '@legendapp/list'
import type React from 'react'
import { useCallback, useState, useRef, useMemo } from 'react'
import {
  AnimatePresence,
  Avatar,
  Button,
  createStyledContext,
  Input,
  LinearGradient,
  Portal,
  SizableText,
  useControllableState,
  useMedia,
  usePresence,
  useThemeName,
  useWindowDimensions,
  View,
  XStack,
  YStack,
} from '@my/ui'
import { IconAccount, IconBadgeCheckSolid2, IconEthereum } from 'app/components/icons'
import { X } from '@tamagui/lucide-icons'
import { useSendScreenParams } from 'app/routers/params'
import { useProfileLookup } from 'app/utils/useProfileLookup'
import { shorten } from 'app/utils/strings'
import { isAndroid, isWeb } from '@tamagui/constants'
import { useCoinFromSendTokenParam } from 'app/utils/useCoinFromTokenParam'

const initialChats = [
  {
    id: '1',
    message: 'Thanks for the coffee!',
    amount: '4.50',
    sender: 'user',
    timestamp: new Date().toISOString(),
  },
  {
    id: '2',
    message: 'Send it for you.',
    amount: '4.50',
    sender: 'bot',
    timestamp: new Date().toISOString(),
  },
  {
    id: '3',
    message: 'Breakfast payback.',
    amount: '35.00',
    sender: 'user',
    timestamp: new Date().toISOString(),
  },
  {
    id: '4',
    message: 'Enjoy your coffee!',
    amount: '35.00',
    sender: 'bot',
    timestamp: new Date().toISOString(),
  },
  {
    id: '5',
    message: 'Lunch payback.',
    amount: '11.75',
    sender: 'user',
    timestamp: new Date().toISOString(),
  },
  {
    id: '6',
    message: 'I like what you did there!',
    amount: '11.75',
    sender: 'bot',
    timestamp: new Date().toISOString(),
  },
]

type Chat = (typeof initialChats)[number]

type Sections = 'chat' | 'enterAmount' | 'reviewAndSend'

const SendChatContext = createStyledContext<{
  activeSection: Sections
  setActiveSection: React.Dispatch<React.SetStateAction<Sections>>
}>({
  activeSection: 'chat',
  setActiveSection: () => {},
})

interface SendChatProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export const SendChat = ({ open: openProp, onOpenChange: onOpenChangeProp }: SendChatProps) => {
  const { height } = useWindowDimensions()
  const [chats, setChats] = useState(initialChats)

  const { lg } = useMedia()

  const [open, setOpen] = useControllableState({
    defaultProp: false,
    prop: openProp,
    onChange: onOpenChangeProp,
  })

  const { coin } = useCoinFromSendTokenParam()

  const [activeSection, setActiveSection] = useState<Sections>('chat')

  const handleSend = useCallback((message: string) => {
    setChats((prev) => [
      ...prev,
      {
        id: Date.now().toString(),
        message,
        amount: '23.5',
        sender: 'user',
        timestamp: new Date().toISOString(),
      },
    ])
  }, [])

  const renderItem = useCallback(({ item }: { item: Chat }) => {
    return <Item item={item} />
  }, [])

  const keyExtractor = useCallback((item: Chat) => item.id, [])

  return (
    <Portal>
      <SendChatContext.Provider activeSection={activeSection} setActiveSection={setActiveSection}>
        <AnimatePresence>
          {open && (
            <View ai="center" jc="center" pos="absolute" zi={10} inset={0}>
              <View
                animation={[
                  'smoothResponsive',
                  {
                    opacity: '100ms',
                    transform: 'responsive',
                  },
                ]}
                animateOnly={['transform', 'opacity']}
                filter="blur(0px)"
                enterStyle={
                  lg
                    ? {
                        y: height,
                        opacity: 0,
                      }
                    : {
                        scale: 0.9,
                        opacity: 0,
                      }
                }
                exitStyle={
                  lg
                    ? {
                        y: height,
                        opacity: 0,
                      }
                    : {
                        scale: 0.9,
                        opacity: 0,
                      }
                }
                rotateZ="0deg"
                y={lg ? -65 : 0}
                w={700}
                maw="95%"
                pe="auto"
                jc="center"
                $lg={{
                  jc: 'flex-end',
                }}
                mih={700}
                f={1}
                py="$4"
              >
                <YStack
                  animation="responsive"
                  h={
                    activeSection === 'chat'
                      ? height * 0.9
                      : activeSection === 'enterAmount'
                        ? 500
                        : 550
                  }
                  animateOnly={['height']}
                >
                  <YStack
                    br="$8"
                    btlr="$11"
                    elevation="$9"
                    shadowOpacity={0.4}
                    ov="hidden"
                    f={1}
                    bg="$color1"
                  >
                    <SendChatHeader onClose={() => setOpen(false)} />
                    <View
                      animation={[
                        'responsive',
                        {
                          opacity: '100ms',
                          transform: 'responsive',
                        },
                      ]}
                      scaleY={activeSection === 'chat' ? 1 : 0.5}
                      opacity={activeSection === 'chat' ? 1 : 0}
                      y={activeSection === 'chat' ? 0 : -50}
                      f={1}
                      $platform-web={{
                        willChange: 'transform',
                        filter: activeSection === 'chat' ? 'blur(0px)' : 'blur(4px)',
                        transition: 'filter linear 100ms',
                      }}
                      animateOnly={['transform', 'opacity']}
                      px="$4.5"
                      $xs={{
                        px: '$2',
                      }}
                    >
                      {/* TODO: move this to another component and memozie it to avoid re-rendering */}
                      <LegendList
                        recycleItems
                        maintainScrollAtEnd
                        alignItemsAtEnd
                        maintainVisibleContentPosition
                        initialScrollIndex={chats.length - 1}
                        data={chats}
                        renderItem={renderItem}
                        keyExtractor={keyExtractor}
                        style={{
                          paddingHorizontal: 12,
                        }}
                      />
                    </View>
                    <SendChatInput />
                    <AnimatePresence>
                      {activeSection !== 'chat' && <EnterAmountNoteSection key="enterAmount" />}
                    </AnimatePresence>
                  </YStack>
                </YStack>
              </View>
            </View>
          )}
        </AnimatePresence>
        <AnimatePresence>
          {open && (
            <View
              pe="auto"
              tag="button"
              role="button"
              aria-label="Close send chat"
              aria-expanded={open}
              tabIndex={0}
              onPress={() => setOpen(false)}
              key="overlay-send-chat"
              enterStyle={{ opacity: 0 }}
              exitStyle={{ opacity: 0 }}
              animation="200ms"
              animateOnly={['opacity']}
              bg="$gray10Dark"
              opacity={0.7}
              pos="absolute"
              inset={0}
            />
          )}
        </AnimatePresence>
      </SendChatContext.Provider>
    </Portal>
  )
}

const SendChatHeader = ({ onClose }: { onClose: () => void }) => {
  const themeName = useThemeName()

  const isDark = themeName.includes('dark')

  const [{ recipient, idType }] = useSendScreenParams()
  const {
    data: profile,
    isLoading,
    error: errorProfileLookup,
  } = useProfileLookup(idType ?? 'tag', recipient ?? '')

  return (
    <XStack
      gap="$3"
      ai="center"
      p="$4"
      bg="$aztec1"
      bbw={1}
      bbc="$gray3"
      $theme-dark={{ bg: '$aztec4', bbc: '$aztec3' }}
    >
      <View>
        <Avatar circular size="$4.5" elevation="$0.75">
          {isAndroid && !profile?.avatar_url ? (
            <Avatar.Image
              src={`https://ui-avatars.com/api/?name=${profile?.name}&size=256&format=png&background=86ad7f`}
            />
          ) : (
            <>
              <Avatar.Image src={profile?.avatar_url ?? ''} />
              <Avatar.Fallback jc="center" bc="$olive">
                <Avatar size="$4.5" circular>
                  <Avatar.Image
                    src={`https://ui-avatars.com/api/?name=${profile?.name}&size=256&format=png&background=86ad7f`}
                  />
                </Avatar>
              </Avatar.Fallback>
            </>
          )}
        </Avatar>
        {profile?.is_verified && (
          <XStack zi={100} pos="absolute" bottom={0} right={0} x="$1" y="$1">
            <XStack pos="absolute" elevation={'$1'} scale={0.5} br={1000} inset={0} />
            <IconBadgeCheckSolid2
              size="$1"
              scale={0.7}
              color="$neon8"
              $theme-dark={{ color: '$neon7' }}
              //@ts-expect-error - checkColor is not typed
              checkColor={isDark ? '#082B1B' : '#fff'}
            />
          </XStack>
        )}
      </View>
      <YStack gap="$1.5">
        <SizableText size="$4" color="$gray12" fow="500">
          {profile?.name || 'No name'}
        </SizableText>
        <SizableText size="$3" color="$gray10">
          {idType === 'address'
            ? shorten(recipient, 5, 4)
            : profile?.tag
              ? `/${profile?.tag}`
              : `#${profile?.sendid}`}
        </SizableText>
      </YStack>
      <Button
        size="$3"
        circular
        animation="100ms"
        animateOnly={['transform']}
        pos="absolute"
        r={0}
        t={0}
        x={-9}
        y={10}
        boc="$aztec3"
        hoverStyle={{
          boc: '$aztec4',
        }}
        pressStyle={{
          boc: '$aztec4',
          scale: 0.9,
        }}
        onPress={onClose}
      >
        <Button.Icon scaleIcon={1.2}>
          <X />
        </Button.Icon>
      </Button>
    </XStack>
  )
}

const SendChatInput = Input.styleable((props) => {
  const { setActiveSection, activeSection } = SendChatContext.useStyledContext()

  const [message, setMessage] = useState('')
  const inputRef = useRef<Input>(null)
  const themeName = useThemeName()

  const gradientColors = useMemo(() => {
    if (themeName.includes('dark')) {
      return ['hsl(190, 40%, 10%, 0.8)', 'hsl(190, 40%, 10%, 0.3)', 'transparent']
    }
    return ['hsl(0, 0%, 92%, 0.5)', 'hsl(0, 0%, 92%, 0.2)', 'transparent']
  }, [themeName])

  return (
    <YStack zi={1}>
      <View
        animation="smoothResponsive"
        animateOnly={['opacity']}
        opacity={activeSection === 'chat' ? 1 : 0}
      >
        <LinearGradient
          // Use the actual aztec3 color value as in line 129
          colors={gradientColors}
          locations={[0, 0.36, 1]}
          start={{ x: 0, y: 1 }}
          end={{ x: 0, y: 0 }}
          pointerEvents="none"
          w="100%"
          h={20}
          y={-18}
          pos="absolute"
        />
      </View>
      <YStack w="100%" zi={1}>
        <XStack py="$4" px="$4">
          <View
            animation="responsive"
            animateOnly={['height', 'transform']}
            h={activeSection === 'chat' ? 47 : 80}
            y={activeSection === 'chat' ? 0 : -62}
            f={1}
          >
            <Input
              bg="$aztec5"
              $theme-light={{
                bg: '$gray3',
              }}
              numberOfLines={4}
              multiline
              onPress={() => setActiveSection('enterAmount')}
              placeholderTextColor="$gray11"
              f={1}
              ref={inputRef}
              autoFocus={false}
              value={message}
              onChangeText={setMessage}
              // use a placeholder that trigger the user to send some crypto with a message
              placeholder="Type amount, add a note..."
              br="$3"
              {...props}
            />
          </View>
        </XStack>
      </YStack>
    </YStack>
  )
})

const EnterAmountNoteSection = YStack.styleable((props) => {
  const { coin } = useCoinFromSendTokenParam()

  const [present] = usePresence()
  const { setActiveSection, activeSection } = SendChatContext.useStyledContext()
  return (
    <YStack
      zi={1}
      pos="absolute"
      bottom={0}
      height={400}
      f={1}
      w="100%"
      gap="$4"
      p="$4"
      jc="flex-end"
      {...props}
      animation="responsive"
      exitStyle={{
        opacity: 0,
        y: 20,
      }}
    >
      <YStack gap="$2.5">
        <View
          animation={[
            'responsive',
            {
              opacity: '100ms',
              transform: 'responsive',
            },
          ]}
          animateOnly={['opacity', 'transform']}
          enterStyle={{
            opacity: 0,
            y: -20,
          }}
          exitStyle={{
            opacity: 0,
            y: -20,
          }}
          gap="$2.5"
        >
          <XStack ai="center" w="100%" jc="space-between">
            <SizableText size="$2" fow="300" col="$gray11">
              You&apos;re Sending
            </SizableText>
            {activeSection === 'reviewAndSend' && (
              <Button onPress={() => setActiveSection('enterAmount')} size="$2" chromeless>
                <Button.Text fos="$3" fow="500" col="$neon10">
                  Edit
                </Button.Text>
              </Button>
            )}
          </XStack>
          <YStack
            gap="$3.5"
            ai="stretch"
            p="$6"
            px="$4"
            br="$4"
            bg="$aztec4"
            $theme-light={{ bg: '$gray2' }}
            animation="responsive"
            animateOnly={['height']}
            h={activeSection === 'reviewAndSend' ? 220 : 170}
            jc="center"
          >
            <AnimatePresence exitBeforeEnter>
              {activeSection === 'reviewAndSend' ? (
                <ReviewSendAmountBox key="review-send-amount-box" />
              ) : (
                <>
                  <XStack
                    key="enter-amount-box"
                    animation="100ms"
                    filter="blur(0px)"
                    enterStyle={{
                      opacity: 0,
                      filter: 'blur(4px)',
                    }}
                  >
                    <Input
                      f={1}
                      unstyled
                      bg="transparent"
                      bbw={1}
                      boc="$gray8"
                      fontFamily="$mono"
                      col="$gray12"
                      pr="$8"
                      placeholderTextColor="$gray11"
                      placeholder="0.000"
                      focusStyle={{
                        bbc: '$primary',
                      }}
                      fontSize={40}
                      fontWeight="500"
                      pb="$2"
                      inputMode={coin?.decimals ? 'decimal' : 'numeric'}
                    />
                    <View t={15} pos="absolute" r={0}>
                      <SizableText>ETH</SizableText>
                    </View>
                  </XStack>
                  <XStack>
                    <SizableText size="$5" col="$gray10">
                      Balance:{' '}
                    </SizableText>
                    <SizableText size="$5" col="$gray12">
                      12500,000
                    </SizableText>
                  </XStack>
                </>
              )}
            </AnimatePresence>
          </YStack>
        </View>
        <View
          //@ts-expect-error - delay is not typed in tamagui
          animation={
            present
              ? [
                  '200ms',
                  {
                    delay: 200,
                  },
                ]
              : null
          }
          // changing animation at runtime require a key change to remount the component and avoid hook errors
          key={present ? 'note-input-enter' : 'note-input-exit'}
          opacity={present ? 1 : 0}
          enterStyle={{
            opacity: 0,
          }}
        >
          <Input
            bg="$aztec5"
            numberOfLines={4}
            ai="flex-start"
            $theme-light={{
              bg: '$gray3',
            }}
            placeholderTextColor="$gray11"
            autoFocus
            placeholder="Type amount, add a note..."
            br="$3"
            multiline
          />
        </View>
      </YStack>
      <Button
        bg="$neon7"
        $theme-light={{
          bg: '$neon7',
        }}
        br="$4"
        animation={[
          'smoothResponsive',
          {
            //@ts-expect-error - delay is not typed in tamagui
            delay: present ? 50 : 0,
          },
        ]}
        animateOnly={['opacity', 'transform']}
        bw={0}
        y={present ? 0 : 20}
        enterStyle={{
          opacity: 0,
          y: 20,
        }}
        hoverStyle={{
          bg: '$neon9',
        }}
        pressStyle={{
          bg: '$neon7',
          scale: 0.98,
        }}
        onPress={() =>
          setActiveSection((prev) => {
            if (prev === 'reviewAndSend') return 'chat'
            return 'reviewAndSend'
          })
        }
      >
        <Button.Text col="$gray1" $theme-light={{ col: '$gray12' }}>
          Send
        </Button.Text>
      </Button>
    </YStack>
  )
})

const ReviewSendAmountBox = YStack.styleable((props) => {
  return (
    <YStack
      key="review-send-amount-box"
      gap="$4"
      {...props}
      animation="200ms"
      animateOnly={['opacity']}
      enterStyle={{
        opacity: 0,
      }}
      exitStyle={{
        opacity: 0,
      }}
    >
      <YStack gap="$5" pb="$5" bbw={1} bbc="$primary">
        <XStack gap="$3" ai="center">
          <IconEthereum />
          <SizableText>ETH</SizableText>
        </XStack>
        <XStack gap="$2">
          <SizableText fos="$10">-12500,000</SizableText>
          <SizableText fos="$2">$360</SizableText>
        </XStack>
      </YStack>
      <XStack jc="space-between">
        <SizableText>Maya receives</SizableText>
        <SizableText fos="$3">+12500,000 SEND</SizableText>
      </XStack>
      <XStack jc="space-between">
        <SizableText>Fees</SizableText>
        <SizableText fos="$3">0.04 USDC</SizableText>
      </XStack>
    </YStack>
  )
})

interface ItemProps {
  item: Chat
}

const Item = YStack.styleable<ItemProps>((props) => {
  const { item } = props
  const isSent = item.sender === 'user'

  return (
    <View py="$4">
      <YStack gap="$2">
        <YStack
          w="60%"
          bg={item.sender === 'user' ? '$aztec6' : '$aztec3'}
          bw={isSent ? 0 : 1}
          boc={item.sender === 'user' ? 'transparent' : '$aztec4'}
          $theme-light={{
            bg: item.sender === 'user' ? '$gray3' : '$gray1',
            boc: item.sender === 'user' ? 'transparent' : '$gray2',
          }}
          br="$5"
          gap="$3"
          p="$3"
          als={item.sender === 'user' ? 'flex-end' : 'flex-start'}
          ov="hidden"
        >
          <SizableText size="$1" fow="300" color="$aztec10">
            {isSent ? 'You sent' : 'You received'}
          </SizableText>
          <XStack ai="center" gap="$2">
            <SizableText size="$7" fow="600" col={isSent ? '$color' : '$neon9'}>
              {isSent ? '-' : '+'}
            </SizableText>
            <SizableText size="$7" fow="600" color={isSent ? '$color' : '$neon9'}>
              {item.amount}
            </SizableText>
            <IconEthereum size="$1" />
          </XStack>
          <View
            p="$2"
            pb="$4"
            px="$3.5"
            br="$2"
            btlr={0}
            btrr={0}
            bg={isSent ? '$aztec5' : '$aztec3'}
            bw={1}
            boc={isSent ? 'transparent' : '$aztec4'}
            $theme-light={{
              bg: isSent ? '$gray1' : '$gray2',
            }}
            mx="$-3.5"
            mb="$-3.5"
          >
            <SizableText size="$3" color="$aztec10">
              {item.message}
            </SizableText>
          </View>
        </YStack>
        <SizableText
          als={item.sender === 'user' ? 'flex-end' : 'flex-start'}
          size="$2"
          color="$gray10"
        >
          {new Date(item.timestamp).toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit',
          })}
        </SizableText>
      </YStack>
    </View>
  )
})
