import {
  Adapt,
  Button,
  FieldError,
  Fieldset,
  Paragraph,
  Select,
  Shake,
  Sheet,
  Spinner,
  Theme,
  XStack,
  YStack,
  getFontSize,
  isWeb,
  useThemeName,
  type SelectProps,
} from '@my/ui'
import { baseMainnet, usdcAddress } from '@my/wagmi'
import { ChevronDown, ChevronUp, CheckCircle as IconCheckCircle } from '@tamagui/lucide-icons'
import { useTsController } from '@ts-react/form'
import { IconX } from 'app/components/icons'
import formatAmount from 'app/utils/formatAmount'
import { useId, useState } from 'react'
import { IconCoin } from '../icons/IconCoin'
import type { CoinWithBalance } from 'app/data/coins'
import { useCoins } from 'app/provider/coins'
export const CoinField = ({
  native = false,
  ...props
}: Pick<SelectProps, 'size' | 'native' | 'defaultValue' | 'onValueChange'>) => {
  const [isOpen, setIsOpen] = useState(false)
  const { coins } = useCoins()

  const {
    field,
    error,
    formState: { isSubmitting },
  } = useTsController<string>()

  const themeName = useThemeName()
  const id = useId()
  const disabled = isSubmitting

  return (
    <Theme name={error ? 'red' : themeName} forceClassName>
      <Fieldset>
        <Shake shakeKey={error?.errorMessage}>
          <Select
            native={native}
            id={id}
            value={field.value}
            onValueChange={field.onChange}
            onOpenChange={setIsOpen}
            defaultValue={usdcAddress[baseMainnet.id]}
            open={isOpen}
            {...props}
          >
            <Select.Trigger
              testID={'SelectCoinTrigger'}
              w={106}
              h={48}
              br="$3"
              borderWidth={0}
              scaleSpace={0}
              scaleIcon={1.5}
              hoverStyle={{ bc: '$primary' }}
              bc={isOpen ? '$color2' : '$primary'}
              iconAfter={isOpen ? <ChevronUp color={'$color11'} /> : <ChevronDown color="$black" />}
            >
              <Select.Value
                testID={'SelectCoinValue'}
                fontWeight={'bold'}
                color={'$black'}
                placeholder={'Token'}
              />
            </Select.Trigger>

            <Adapt when="sm" platform="touch">
              <Sheet
                native
                modal
                dismissOnSnapToBottom
                snapPoints={['fit']}
                snapPointsMode="fit"
                animation={'quick'}
              >
                <Sheet.Frame maw={738} bc={'$color1'}>
                  <Sheet.Handle
                    py="$5"
                    f={1}
                    bc="transparent"
                    jc={'space-between'}
                    opacity={1}
                    m={0}
                  >
                    <XStack ai="center" jc="space-between" w="100%" px="$4">
                      <Paragraph fontSize={'$5'} fontWeight={'700'} color={'$color12'}>
                        Select Currency
                      </Paragraph>
                      <Button
                        chromeless
                        unstyled
                        icon={<IconX color={'$color12'} size={'$1.5'} />}
                        onPress={() => setIsOpen(false)}
                      />
                    </XStack>
                  </Sheet.Handle>
                  <Sheet.ScrollView>
                    <Adapt.Contents />
                  </Sheet.ScrollView>
                </Sheet.Frame>
                <Sheet.Overlay />
              </Sheet>
            </Adapt>

            <Select.Content zIndex={200000}>
              <Select.Viewport
                disableScroll
                backgroundColor={'$color1'}
                br={'$3'}
                btrr={0}
                boc="transparent"
                focusStyle={{ bc: '$color0' }}
              >
                <XStack als="flex-start" w={320} $sm={{ w: '100%' }} boc={'transparent'} f={1}>
                  <Select.Group disabled={disabled} space="$0">
                    {/* <Select.Label>{label}</Select.Label> */}
                    {coins.map((coin, i) => {
                      return (
                        <CoinFieldItem
                          active={coin.token === field.value}
                          coin={coin}
                          index={i}
                          key={coin.token}
                        />
                      )
                    })}
                  </Select.Group>
                  {/* special icon treatment for native */}
                  {native && isWeb && (
                    <YStack
                      position="absolute"
                      right={0}
                      top={0}
                      bottom={0}
                      alignItems="center"
                      justifyContent="center"
                      width={'$4'}
                      pointerEvents="none"
                    >
                      <ChevronDown size={getFontSize((props.size ?? '$true') as number)} />
                    </YStack>
                  )}
                </XStack>
              </Select.Viewport>
            </Select.Content>
          </Select>
        </Shake>
        <FieldError message={error?.errorMessage} />
      </Fieldset>
    </Theme>
  )
}

const CoinFieldItem = ({
  active,
  coin,
  index,
}: {
  active: boolean
  coin: CoinWithBalance
  index: number
}) => {
  return (
    <Select.Item index={index} key={coin.token} value={coin.token} bc="transparent" f={1} w="100%">
      <XStack gap={'$2'} $gtLg={{ gap: '$3.5' }} ai={'center'} jc={'space-between'}>
        <IconCoin symbol={coin.symbol} />
        <Select.ItemText
          fontSize={'$5'}
          fontWeight={'500'}
          textTransform={'uppercase'}
          color={'$color12'}
        >
          {coin.symbol}
        </Select.ItemText>
        {active && <IconCheckCircle color={'$color12'} size={'$1.5'} />}
      </XStack>
      <XStack gap={'$3.5'} ai={'center'}>
        <TokenBalance coin={coin} />
      </XStack>
    </Select.Item>
  )
}

const TokenBalance = ({ coin: { balance, decimals } }: { coin: CoinWithBalance }) => {
  const { isLoading } = useCoins()

  if (isLoading) {
    return <Spinner size={'small'} />
  }
  if (balance === undefined) {
    return <></>
  }
  return (
    <Paragraph fontFamily={'$mono'} fontSize={'$9'} fontWeight={'500'} color={'$color12'}>
      {formatAmount((Number(balance) / 10 ** decimals).toString())}
    </Paragraph>
  )
}
