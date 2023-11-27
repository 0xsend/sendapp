import {
  Button,
  Container,
  H1,
  Paragraph,
  Separator,
  SizableText,
  Tabs,
  TabsContentProps,
  Text,
  Theme,
  XStack,
  YStack,
  useThemeName
} from '@my/ui'
import { IconEthereum } from 'app/components/icons/IconEthereum'
import { NumPadButton } from './components/numpad-button'
import { Select } from './components/select'
import { MainLayout } from 'app/components/layout'

const items = [
  { name: 'ETH' },
  { name: 'BSC' },
  { name: 'TRON' },
]

export function SendScreen() {
  const themeName = useThemeName()

  return (
    <Theme name={themeName}>
      <MainLayout>
        <YStack>
          <XStack space="$1.5">
            <Paragraph opacity={0}>Bal1.25</Paragraph>
            <H1 fontSize="$15">0.25</H1>
            <Paragraph>Bal1.25</Paragraph>
          </XStack>
          <XStack jc="center" mt="$6">
            <Select items={items} />
          </XStack>
          <YStack space="$5" mt="$9">
            <XStack jc="center" space="$6">
              <NumPadButton num>1</NumPadButton>
              <NumPadButton num>2</NumPadButton>
              <NumPadButton num>3</NumPadButton>
            </XStack>
            <XStack jc="center" space="$6">
              <NumPadButton num>4</NumPadButton>
              <NumPadButton num>5</NumPadButton>
              <NumPadButton num>6</NumPadButton>
            </XStack>
            <XStack jc="center" space="$6">
              <NumPadButton num>7</NumPadButton>
              <NumPadButton num>8</NumPadButton>
              <NumPadButton num>9</NumPadButton>
            </XStack>
            <XStack jc="center" space="$6">
              <NumPadButton>.</NumPadButton>
              <NumPadButton num>0</NumPadButton>
              <NumPadButton>&lt;</NumPadButton>
            </XStack>
          </YStack>
          <XStack jc="center" my="$6">
            <Button
              fullscreen
              py="$6"
              borderRadius="$9"
              bc="$backgroundTransparent"
              boc="$borderColorFocus"
              fontSize="$6"
            >
              Continue
            </Button>
          </XStack>
        </YStack>
      </MainLayout>
    </Theme>
  )
}
