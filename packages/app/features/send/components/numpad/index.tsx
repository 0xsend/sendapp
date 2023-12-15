import { H1, SizableText, XStack, YStack } from "@my/ui"
import { NumpadButton } from "./numpad-button"
import { Select } from '../../components/select'
import { INumPadProps } from "../../types"
import { useTransferContext } from "../../providers/transfer-provider"
import formatNumpadInput from "app/utils/formatNumpadInput"

export const NumPad = ({ value, setValue }: INumPadProps) => {
  const { transferContext, updateTransferContext } = useTransferContext()

  const { balance, tokens, currentToken } = transferContext

  const numpadpressHandler = (input: string) => {
    setValue(formatNumpadInput(value, input, balance))
  }

  const setCurrentToken = (value: string) => {
    const token = tokens.filter((tok) => tok.name.toLowerCase() === value)[0]
    updateTransferContext({ currentToken: token })
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
        <Select items={tokens} currentItem={currentToken} onValueChange={setCurrentToken} />
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