import { XStack, YStack } from "@my/ui"
import { NumPadButton } from "./numpad-button"

interface INumPadProps {
  value: string
  setValue: (val: string) => void
}

export const NumPad = ({ value, setValue }: INumPadProps) => {
  const numpadpressHandler = (val: string) => {
    if (val === '.') {
      if (!value.includes('.')) {
        setValue(value + '.')
      }
    } else if (val === '<') {
      if (value.length === 1) {
        setValue('0')
      } else {
        setValue(value.slice(0, -1))
      }
    } else {
      if (value === '0') {
        setValue(val)
      } else {
        setValue(value + val)
      }
    }
  }

  return (
    <YStack space={'$5'} mt={'$9'}>
      <XStack jc={'center'} space={'$6'}>
        <NumPadButton pressHandler={numpadpressHandler} value={'1'} num />
        <NumPadButton pressHandler={numpadpressHandler} value={'2'} num />
        <NumPadButton pressHandler={numpadpressHandler} value={'3'} num />
      </XStack>
      <XStack jc={'center'} space={'$6'}>
        <NumPadButton pressHandler={numpadpressHandler} value={'4'} num />
        <NumPadButton pressHandler={numpadpressHandler} value={'5'} num />
        <NumPadButton pressHandler={numpadpressHandler} value={'6'} num />
      </XStack>
      <XStack jc={'center'} space={'$6'}>
        <NumPadButton pressHandler={numpadpressHandler} value={'7'} num />
        <NumPadButton pressHandler={numpadpressHandler} value={'8'} num />
        <NumPadButton pressHandler={numpadpressHandler} value={'9'} num />
      </XStack>
      <XStack jc={'center'} space={'$6'}>
        <NumPadButton pressHandler={numpadpressHandler} value={'.'} />
        <NumPadButton pressHandler={numpadpressHandler} value={'0'} num />
        <NumPadButton pressHandler={numpadpressHandler} value={'<'} />
      </XStack>
    </YStack>
  )
}