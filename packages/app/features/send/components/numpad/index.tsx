import { H1, SizableText, XStack, YStack } from "@my/ui"
import { NumpadButton } from "./numpad-button"
import { Select } from 'app/features/send/components/select'
import { INumPadProps } from "app/features/send/types"
import { useTransferContext } from "app/features/send/providers/transfer-provider"
import formatNumpadInput from "app/utils/formatNumpadInput"

export const NumPad = ({ value, setValue }: INumPadProps) => {
  const { balance, tokens, currentToken, setCurrentToken } = useTransferContext()

  const numpadpressHandler = (input: string) => {
    setValue(formatNumpadInput(value, input, balance))
  }

  const updateCurrentToken = (value: string) => {
    const token = tokens.filter((tok) => tok.name.toLowerCase() === value)[0]
    setCurrentToken(token ?? currentToken)
  }

  return (
    <YStack>
      <XStack jc={'center'}>
        <H1
          size={value.length > 4 ? value.length > 8 ? '$10' : '$12' : '$14'}
          minHeight={'$10'}
          $shorter={{
            size: value.length > 4 ? value.length > 8 ? '$10' : '$11' : '$12',
            minHeight: '$7'
          }}
        >
          {Number(value).toLocaleString('en-US', { maximumFractionDigits: 20 })}
        </H1>
      </XStack>
      <XStack jc={'space-between'} mt={'$2'}>
        <Select items={tokens} currentItem={currentToken} onValueChange={updateCurrentToken} />
        <XStack
          px={'$5'}
          py={'$2.5'}
          space={'$1.5'}
          br={'$6'}
          borderWidth={1}
          borderColor={'$backgroundFocus'}
          $shorter={{
            px: '$4',
            py: '$2'
          }}
        >
          <SizableText theme={'alt2'}>Bal</SizableText>
          <SizableText fontWeight={'700'}>{balance}</SizableText>
        </XStack>
      </XStack>
      <YStack space={'$5'} mt={'$6'} $shorter={{ space: '$3', mt: '$6' }}>
        <XStack jc={'center'} space={'$6'} $shorter={{ space: '$4' }}>
          <NumpadButton pressHandler={numpadpressHandler} value={'1'} num />
          <NumpadButton pressHandler={numpadpressHandler} value={'2'} num />
          <NumpadButton pressHandler={numpadpressHandler} value={'3'} num />
        </XStack>
        <XStack jc={'center'} space={'$6'} $shorter={{ space: '$4' }}>
          <NumpadButton pressHandler={numpadpressHandler} value={'4'} num />
          <NumpadButton pressHandler={numpadpressHandler} value={'5'} num />
          <NumpadButton pressHandler={numpadpressHandler} value={'6'} num />
        </XStack>
        <XStack jc={'center'} space={'$6'} $shorter={{ space: '$4' }}>
          <NumpadButton pressHandler={numpadpressHandler} value={'7'} num />
          <NumpadButton pressHandler={numpadpressHandler} value={'8'} num />
          <NumpadButton pressHandler={numpadpressHandler} value={'9'} num />
        </XStack>
        <XStack jc={'center'} space={'$6'} $shorter={{ space: '$4' }}>
          <NumpadButton pressHandler={numpadpressHandler} value={'.'} disabled={value.includes('.')} />
          <NumpadButton pressHandler={numpadpressHandler} value={'0'} num />
          <NumpadButton pressHandler={numpadpressHandler} value={'<'} />
        </XStack>
      </YStack>
    </YStack>
  )
}