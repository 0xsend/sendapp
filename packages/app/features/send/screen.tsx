import {
  Button,
  Container,
  H1,
  Paragraph,
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
        <Container>
          <YStack>
            <XStack jc={'center'}>
              <H1 size={'$15'}>0.25</H1>
              <XStack pos={'absolute'} r={0} space={'$1.5'}>
                <Paragraph opacity={0.42}>Bal</Paragraph>
                <Paragraph>1.25</Paragraph>
              </XStack>
            </XStack>
            <XStack jc={'center'} mt={'$6'}>
              <Select items={items} />
            </XStack>
            <YStack space={'$5'} mt={'$9'}>
              <XStack jc={'center'} space={'$6'}>
                <NumPadButton num>1</NumPadButton>
                <NumPadButton num>2</NumPadButton>
                <NumPadButton num>3</NumPadButton>
              </XStack>
              <XStack jc={'center'} space={'$6'}>
                <NumPadButton num>4</NumPadButton>
                <NumPadButton num>5</NumPadButton>
                <NumPadButton num>6</NumPadButton>
              </XStack>
              <XStack jc={'center'} space={'$6'}>
                <NumPadButton num>7</NumPadButton>
                <NumPadButton num>8</NumPadButton>
                <NumPadButton num>9</NumPadButton>
              </XStack>
              <XStack jc={'center'} space={'$6'}>
                <NumPadButton>.</NumPadButton>
                <NumPadButton num>0</NumPadButton>
                <NumPadButton>&lt;</NumPadButton>
              </XStack>
            </YStack>
            <Button
              my={'$6'}
              py={'$6'}
              borderRadius={'$9'}
              bc={'$backgroundTransparent'}
              boc={'$borderColorFocus'}
              size={'$6'}
            >
              Continue
            </Button>
          </YStack>
        </Container>
      </MainLayout>
    </Theme>
  )
}
