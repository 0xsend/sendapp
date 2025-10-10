import {
  Adapt,
  Button,
  FieldError,
  Fieldset,
  getFontSize,
  isTouchable,
  isWeb,
  Paragraph,
  ScrollView,
  Select,
  type SelectProps,
  Shake,
  Sheet,
  Spinner,
  Theme,
  useThemeName,
  XStack,
  YStack,
} from '@my/ui'
import { baseMainnet, usdcAddress } from '@my/wagmi'
import { ChevronDown, ChevronUp } from '@tamagui/lucide-icons'
import { useTsController } from '@ts-react/form'
import { IconCheckCircle, IconX } from 'app/components/icons'
import formatAmount from 'app/utils/formatAmount'
import { useId, useState } from 'react'
import { IconCoin } from '../icons/IconCoin'
import type { CoinWithBalance } from 'app/data/coins'
import { useCoins } from 'app/provider/coins'
import { useHoverStyles } from 'app/utils/useHoverStyles'
import { Platform, Dimensions } from 'react-native'

export const CoinField = ({
  native = false,
  showAllCoins = false,
  ...props
}: { showAllCoins?: boolean } & Pick<
  SelectProps,
  'size' | 'native' | 'defaultValue' | 'onValueChange'
>) => {
  const [isOpen, setIsOpen] = useState(false)
  const { coins: _coins, allCoins } = useCoins()
  const hoverStyles = useHoverStyles()

  const coins = showAllCoins ? allCoins : _coins

  const {
    field,
    error,
    formState: { isSubmitting },
  } = useTsController<string>()

  const themeName = useThemeName()
  const id = useId()
  const disabled = isSubmitting

  const pickedCoinSymbol = coins.find((coin) => coin.token === field.value)?.symbol

  // Calculate dynamic snap point for Sheet
  const filteredCoins = coins.filter((coin) => showAllCoins || (coin.balance && coin.balance >= 0n))
  const headerHeight = 90
  const itemHeight = 70
  const contentHeight = headerHeight + filteredCoins.length * itemHeight
  const screenHeight = Dimensions.get('window').height
  const contentPercentage = (contentHeight / screenHeight) * 100

  // Use fit-content if less than 75%, otherwise lock at 75%
  const useFitContent = contentPercentage <= 75
  const snapPoints = useFitContent ? ['fit'] : [75]
  const snapPointsMode = useFitContent ? 'fit' : 'percent'

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
              br={999}
              borderWidth={0}
              scaleSpace={0.5}
              scaleIcon={1.5}
              padding={'$2'}
              bc={hoverStyles.backgroundColor}
              focusStyle={{
                bc: 'transparent',
              }}
              hoverStyle={hoverStyles}
              $gtSm={{ p: '$2.5' }}
              iconAfter={
                isOpen ? (
                  <ChevronUp color={'$primary'} $theme-light={{ color: '$color12' }} />
                ) : (
                  <ChevronDown color="$primary" $theme-light={{ color: '$color12' }} />
                )
              }
              style={{
                width: 'fit-content',
              }}
            >
              <XStack gap={'$2'} ai={'center'}>
                {pickedCoinSymbol && <IconCoin symbol={pickedCoinSymbol} size={'$2'} />}
                <Select.Value
                  testID={'SelectCoinValue'}
                  size={'$5'}
                  color={'$color12'}
                  placeholder={'Token'}
                  $gtSm={{
                    size: '$5',
                  }}
                />
              </XStack>
            </Select.Trigger>

            <Adapt when="sm" platform="touch">
              <Sheet
                native
                modal
                dismissOnSnapToBottom
                snapPoints={snapPoints}
                snapPointsMode={snapPointsMode}
                disableDrag={!useFitContent}
                animation={'quick'}
              >
                <Sheet.Frame maw={738} bc={'$color1'} px={'$3.5'} py={'$6'}>
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
                  <ScrollView showsVerticalScrollIndicator={false}>
                    <Adapt.Contents />
                  </ScrollView>
                </Sheet.Frame>
                <Sheet.Overlay />
              </Sheet>
            </Adapt>

            <Select.Content zIndex={200000}>
              <Select.Viewport
                disableScroll
                backgroundColor={'$color1'}
                btrr={0}
                boc="transparent"
                x={'-50%'}
                $gtLg={{
                  x: 0,
                }}
                br={'$6'}
                overflow={'hidden'}
              >
                <XStack
                  als="flex-start"
                  w={320}
                  $sm={{ w: isTouchable ? '100%' : 320 }}
                  boc={'transparent'}
                  f={1}
                  maxHeight={isTouchable ? 'unset' : 275}
                  overflowY={isTouchable ? 'hidden' : 'scroll'}
                >
                  <Select.Group disabled={disabled} space="$0" p={'$2'}>
                    {/* <Select.Label>{label}</Select.Label> */}
                    {filteredCoins.map((coin, i) => {
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
    <Select.Item
      index={index}
      key={coin.token}
      value={coin.token}
      f={1}
      w="100%"
      bw={0}
      br={'$4'}
      bc={'transparent'}
      cursor={'pointer'}
      focusStyle={{ backgroundColor: 'transparent' }}
      hoverStyle={{ backgroundColor: 'transparent' }}
    >
      <XStack gap={'$2'} $gtLg={{ gap: '$3.5' }} ai={'center'} jc={'space-between'}>
        <IconCoin symbol={coin.symbol} />
        <Select.ItemText
          fontSize={'$7'}
          fontWeight={Platform.OS === 'web' ? '500' : '600'}
          textTransform={'uppercase'}
          color={'$color12'}
          lineHeight={36}
        >
          {coin.symbol}
        </Select.ItemText>
        {active && (
          <IconCheckCircle size="$0.9" color={'$primary'} $theme-light={{ color: '$color12' }} />
        )}
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
    <Paragraph
      fontSize={'$7'}
      fontWeight={Platform.OS === 'web' ? '500' : '600'}
      color={'$color12'}
    >
      {formatAmount((Number(balance) / 10 ** decimals).toString())}
    </Paragraph>
  )
}
