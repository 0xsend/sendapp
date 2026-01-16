import { View, H2, YStack, Button, type ButtonProps, isWeb, Link } from '@my/ui'
import type { IconProps } from '@tamagui/helpers-icon'
import { DollarSign, Percent, Wallet } from '@tamagui/lucide-icons'
import type { ComponentType } from 'react'
export function SendActions() {
  return (
    <View gap="$4">
      <H2 fos="$8" fow="600" col="$color12">
        Send Actions
      </H2>
      <YStack ov="hidden" br={10} maw={600}>
        <EachItem iconLeft={DollarSign} title="Send via Link" onPress={() => {}} />
        <EachItem
          iconLeft={Percent}
          title="Send to Savings"
          onPress={() => {}}
          href="earn/usdc/deposit"
        />
        <EachItem iconLeft={Wallet} title="Send to External Wallet" onPress={() => {}} />
      </YStack>
    </View>
  )
}

interface EachItemProps extends ButtonProps {
  iconLeft: ComponentType<IconProps>
  title: string
  onPress: () => void
  href?: string
}

function EachItem({ iconLeft, title, onPress, href }: EachItemProps) {
  const Icon = iconLeft
  const buttonContent = (
    <Button
      onPress={onPress}
      size="$8"
      px={25}
      py={0}
      icon={<Icon color={'$gray10'} />}
      br={0}
      w="100%"
      h={80}
      jc="flex-start"
      animation="responsive"
      animateOnly={['transform']}
      hoverStyle={{
        scale: 1.01,
        bg: '$background',
      }}
      pressStyle={{
        scale: isWeb ? 0.99 : 0.97,
        bg: '$background',
      }}
    >
      <Button.Text col="$gray12" size="$6">
        {title}
      </Button.Text>
    </Button>
  )

  if (href) {
    return <Link href={href}>{buttonContent}</Link>
  }

  return buttonContent
}
