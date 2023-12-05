import { XStack, YStack } from "@my/ui"
import { NumpadButton } from "./numpad-button"
import formatNumpadInput from "app/utils/formatNumpadInput"
import { NumPadProps } from "../../types"

export const NumPad = ({ value, setValue }: NumPadProps) => {
  const numpadpressHandler = (input: string) => {
    setValue(formatNumpadInput(value, input));
  }

  return (
    <YStack space={'$5'} mt={'$9'}>
      <XStack jc={'center'} space={'$6'}>
        <NumpadButton pressHandler={numpadpressHandler} value={'1'} num />
        <NumpadButton pressHandler={numpadpressHandler} value={'2'} num />
        <NumpadButton pressHandler={numpadpressHandler} value={'3'} num />
      </XStack>
      <XStack jc={'center'} space={'$6'}>
        <NumpadButton pressHandler={numpadpressHandler} value={'4'} num />
        <NumpadButton pressHandler={numpadpressHandler} value={'5'} num />
        <NumpadButton pressHandler={numpadpressHandler} value={'6'} num />
      </XStack>
      <XStack jc={'center'} space={'$6'}>
        <NumpadButton pressHandler={numpadpressHandler} value={'7'} num />
        <NumpadButton pressHandler={numpadpressHandler} value={'8'} num />
        <NumpadButton pressHandler={numpadpressHandler} value={'9'} num />
      </XStack>
      <XStack jc={'center'} space={'$6'}>
        <NumpadButton pressHandler={numpadpressHandler} value={'.'} />
        <NumpadButton pressHandler={numpadpressHandler} value={'0'} num />
        <NumpadButton pressHandler={numpadpressHandler} value={'<'} />
      </XStack>
    </YStack>
  )
}