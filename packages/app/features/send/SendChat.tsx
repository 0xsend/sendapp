import { LegendList } from '@legendapp/list'
import { useCallback, useState, useRef, useMemo } from 'react'
import {
  AnimatePresence,
  Avatar,
  Button,
  createStyledContext,
  Input,
  LinearGradient,
  SizableText,
  usePresence,
  useThemeName,
  View,
  XStack,
  YStack,
} from '@my/ui'
import { IconAccount, IconBadgeCheckSolid2, IconEthereum } from 'app/components/icons'
import { X } from '@tamagui/lucide-icons'

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

const SendChatContext = createStyledContext<{
  activePage: 'chat' | 'enterAmount'
  setActivePage: (page: 'chat' | 'enterAmount') => void
}>({
  activePage: 'chat',
  setActivePage: () => {},
})

export const SendChat = () => {
  const [chats, setChats] = useState(initialChats)

  const [activePage, setActivePage] = useState<'chat' | 'enterAmount'>('chat')

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
    <SendChatContext.Provider activePage={activePage} setActivePage={setActivePage}>
      <View jc="flex-end" mih={700} f={1} py="$4">
        <View
          animation="responsive"
          h={activePage === 'chat' ? 700 : 500}
          w={400}
          animateOnly={['height']}
        >
          <YStack
            br="$8"
            btlr="$11"
            elevation="$3"
            shadowOpacity={0.4}
            ov="hidden"
            f={1}
            bg="$color1"
          >
            <SendChatHeader />
            <View
              animation={[
                'responsive',
                {
                  opacity: '100ms',
                  transform: 'responsive',
                },
              ]}
              scaleY={activePage === 'chat' ? 1 : 0.5}
              opacity={activePage === 'chat' ? 1 : 0}
              y={activePage === 'chat' ? 0 : -50}
              f={1}
              $platform-web={{
                willChange: 'transform',
                filter: activePage === 'chat' ? 'blur(0px)' : 'blur(4px)',
                transition: 'filter linear 100ms',
              }}
              animateOnly={['transform', 'opacity']}
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
              {activePage === 'enterAmount' && (
                <EnterAmountNoteSection key="enterAmount" onPress={() => setActivePage('chat')} />
              )}
            </AnimatePresence>
          </YStack>
        </View>
      </View>
    </SendChatContext.Provider>
  )
}

const SendChatHeader = () => {
  const themeName = useThemeName()

  const isDark = themeName.includes('dark')

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
        <Avatar circular size="$4.5">
          <Avatar.Image src="https://randomuser.me/api/portraits/men/1.jpg" />
          <Avatar.Fallback>
            <IconAccount size="$2" color="$color12" />
          </Avatar.Fallback>
        </Avatar>
        {true && (
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
          Jack Smith
        </SizableText>
        <SizableText size="$3" color="$gray10">
          /jacksmith
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
      >
        <Button.Icon scaleIcon={1.2}>
          <X />
        </Button.Icon>
      </Button>
    </XStack>
  )
}

const SendChatInput = Input.styleable((props) => {
  const { setActivePage, activePage } = SendChatContext.useStyledContext()

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
        opacity={activePage === 'chat' ? 1 : 0}
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
            h={activePage === 'chat' ? 47 : 80}
            y={activePage === 'chat' ? 0 : -62}
            f={1}
          >
            <Input
              bg="$aztec5"
              $theme-light={{
                bg: '$gray3',
              }}
              numberOfLines={4}
              multiline
              onPress={() => setActivePage('enterAmount')}
              placeholderTextColor="$gray11"
              f={1}
              ref={inputRef}
              autoFocus
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
  const [present] = usePresence()
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
            {/* <Button size="$2" chromeless>
              <Button.Text col="$neon10">Edit</Button.Text>
            </Button> */}
          </XStack>
          <YStack
            gap="$3.5"
            ai="stretch"
            p="$6"
            px="$4"
            br="$4"
            bg="$aztec4"
            $theme-light={{ bg: '$gray2' }}
          >
            <XStack>
              <Input
                f={1}
                unstyled
                bg="transparent"
                bbw={1}
                boc="$neon2"
                col="$gray12"
                pr="$8"
                placeholderTextColor="$gray11"
                placeholder="Amount"
                focusStyle={{
                  bbc: '$primary',
                }}
                fontSize={24}
                pb="$4"
              />
              <View t={15} pos="absolute" r={0}>
                <SizableText>ETH</SizableText>
              </View>
            </XStack>
            <XStack>
              <SizableText size="$5" col="$gray10">
                Balance:{' '}
              </SizableText>
              <SizableText size="$5">12500,000</SizableText>
            </XStack>
          </YStack>
        </View>
        <View
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
      >
        <Button.Text col="$gray1" $theme-light={{ col: '$gray12' }}>
          Send
        </Button.Text>
      </Button>
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
