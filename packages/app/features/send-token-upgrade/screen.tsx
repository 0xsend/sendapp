import { YStack, XStack, Stack, H1, H4, Card, Paragraph, Button, Theme } from '@my/ui'
import { IconUpgrade } from 'app/components/icons'

interface TokenBalanceRowProps {
  label: string
  amount: string
}

function TokenBalanceRow({ label, amount }: TokenBalanceRowProps) {
  return (
    <XStack w="100%" ai="center" jc="space-between">
      <XStack ai="center" gap="$2">
        <Theme name="green">
          <Stack w={16} h={16} br="$2" bc="$color8" />
        </Theme>
        <H4 color="$color11">{label}</H4>
      </XStack>
      <Paragraph fontSize="$6" fontWeight="600">
        {amount} SEND
      </Paragraph>
    </XStack>
  )
}

export function SendTokenUpgradeScreen() {
  return (
    <YStack f={1} ai="center" jc="center" px="$4" gap="$6">
      <Theme name="green">
        <Stack mb="$2">
          <IconUpgrade size="$4" />
        </Stack>
      </Theme>

      <YStack ai="center" gap="$2">
        <H1 fontWeight="800" tt="uppercase">
          TOKEN UPGRADE
        </H1>
        <Paragraph color="$color10" ta="center" fontSize="$6" maw={400}>
          Upgrade required to continue using Send. New total supply: 100B → 1B
        </Paragraph>
      </YStack>

      <Card w="100%" maw={500} p="$5" gap="$4">
        <TokenBalanceRow label="CURRENT" amount="10,598,526" />
        <TokenBalanceRow label="AFTER" amount="105,985" />
      </Card>

      <YStack gap="$4" w="100%" maw={500}>
        <Paragraph color="$color10" ta="center">
          Click "Upgrade" to proceed.
        </Paragraph>

        <Button size="$4" theme="green" br="$4" w="100%" h={56} pressStyle={{ opacity: 0.8 }}>
          <XStack gap="$2" ai="center">
            <IconUpgrade size="$1" color="$color0" />
            <Paragraph color="$color0" fontWeight="500">
              UPGRADE
            </Paragraph>
          </XStack>
        </Button>

        <Button variant="outlined" size="$4" theme="green" br="$4" w="100%">
          <Paragraph color="$green10" fontSize="$4" textDecorationLine="underline">
            Read more about the Upgrade
          </Paragraph>
        </Button>
      </YStack>
    </YStack>
  )
}
