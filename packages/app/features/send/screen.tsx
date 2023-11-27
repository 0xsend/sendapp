import { useState } from 'react'
import {
  Button,
  Container,
  H1,
  Paragraph,
  Theme,
  XStack,
  YStack,
} from '@my/ui'
import { MainLayout } from 'app/components/layout'
import { IconEthereum } from 'app/components/icons/IconEthereum'
import { Select } from './components/select'
import { NumPad } from './components/numpad'

const items = [
  { name: 'ETH' },
  { name: 'BSC' },
  { name: 'TRON' },
]

export function SendScreen() {
  const [value, setValue] = useState('0.25')

  return (
    <MainLayout>
      <Container>
        <YStack maw={316} pt={'$13'}>
          <XStack jc={'center'}>
            <H1 size={value.length > 4 ? value.length > 8 ? '$9' : '$12' : '$15'}>
              {Number(value).toLocaleString()}
            </H1>
            <XStack pos={'absolute'} r={0} space={'$1.5'}>
              <Paragraph theme={'alt2'}>Bal</Paragraph>
              <Paragraph>1.25</Paragraph>
            </XStack>
          </XStack>
          <XStack jc={'center'} mt={'$6'}>
            <Select items={items} />
          </XStack>
          <NumPad value={value} setValue={setValue} />
          <Button
            my={'$6'}
            py={'$6'}
            borderRadius={'$9'}
            bc={'$backgroundTransparent'}
            boc={'$borderColorFocus'}
          >
            <Paragraph size={'$6'} fontWeight={'700'}>
              Continue
            </Paragraph>
          </Button>
        </YStack>
      </Container>
    </MainLayout>
  )
}
