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
  SizableText,
  Spinner,
  Theme,
  useThemeName,
  View,
  XStack,
  YStack,
} from '@my/ui'
import { baseMainnet, usdcAddress } from '@my/wagmi'
import { Check, ChevronDown } from '@tamagui/lucide-icons'
import formatAmount from 'app/utils/formatAmount'
import { memo, startTransition, useEffect, useId, useState } from 'react'
import { IconCoin } from 'app/components/icons/IconCoin'
import type { CoinWithBalance } from 'app/data/coins'
import { cantonCoin } from 'app/data/coins'
import { useCoins } from 'app/provider/coins'
import { useHoverStyles } from 'app/utils/useHoverStyles'
import { Dimensions } from 'react-native'
import { useController, useFormContext } from 'react-hook-form'

export const CoinField = memo(
  ({
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

    const [renderTemplate, setRenderTemplate] = useState(true)
    useEffect(() => {
      setTimeout(() => {
        startTransition(() => {
          setRenderTemplate(false)
        })
      }, 200)
    }, [])

    const coins = showAllCoins ? allCoins : _coins

    const { formState } = useFormContext<{ token: string }>()
    const {
      field,
      fieldState: { error },
    } = useController({
      name: 'token',
    })

    const themeName = useThemeName()
    const id = useId()
    const disabled = formState.isSubmitting

    const pickedCoinSymbol = coins.find((coin) => coin.token === field.value)?.symbol

    // Calculate dynamic snap point for Sheet
    const filteredCoins = coins
      .filter((coin) => showAllCoins || (coin.balance && coin.balance >= 0n))
      .filter((coin) => coin.token !== cantonCoin.token) // Exclude Canton from swap/send - not yet supported
    const headerHeight = 90
    const itemHeight = 70
    const contentHeight = headerHeight + filteredCoins.length * itemHeight
    const screenHeight = Dimensions.get('window').height
    const contentPercentage = (contentHeight / screenHeight) * 100

    // Use fit-content if less than 75%, otherwise lock at 75%
    const useFitContent = contentPercentage <= 75
    const snapPoints = useFitContent ? ['fit'] : [75]
    const snapPointsMode = useFitContent ? 'fit' : 'percent'

    if (renderTemplate) {
      const templateContent = (
        <Button
          unstyled
          fd="row"
          br={999}
          gap="$1"
          jc="center"
          ai="center"
          borderWidth={0}
          scaleSpace={0.5}
          padding={'$2'}
          onPress={() => {
            setIsOpen(true)
          }}
          bc={hoverStyles.backgroundColor}
          focusStyle={{
            bc: 'transparent',
          }}
          disabledStyle={{
            opacity: 0.5,
          }}
          hoverStyle={hoverStyles}
          $gtSm={{ p: '$2.5' }}
          iconAfter={
            <View
              x={-2}
              y={1}
              scale={0.9}
              animation="responsive"
              rotateZ={isOpen ? '180deg' : '0deg'}
            >
              <ChevronDown color="$primary" $theme-light={{ color: '$color12' }} />
            </View>
          }
          $platform-web={{ width: 'fit-content' }}
          disabled={filteredCoins.length === 0}
        >
          <XStack py={1} gap={'$2'} ai={'center'}>
            {pickedCoinSymbol && <IconCoin symbol={pickedCoinSymbol} size={'$2'} />}
            <SizableText size="$5" fow="400">
              {filteredCoins.length > 0 && pickedCoinSymbol}
            </SizableText>
          </XStack>
        </Button>
      )
      return templateContent
    }

    return (
      <Theme name={error ? 'red' : themeName} forceClassName>
        <Fieldset>
          <Shake shakeKey={error?.message}>
            <Select
              native={native}
              id={id}
              value={field.value}
              onValueChange={field.onChange}
              onOpenChange={setIsOpen}
              defaultValue={usdcAddress[baseMainnet.id]}
              open={isOpen}
              disablePreventBodyScroll
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
                  <View
                    x={-2}
                    y={1}
                    scale={0.9}
                    animation="responsive"
                    rotateZ={isOpen ? '180deg' : '0deg'}
                  >
                    <ChevronDown color="$primary" $theme-light={{ color: '$color12' }} />
                  </View>
                }
                $platform-web={{ width: 'fit-content' }}
                disabled={filteredCoins.length === 0}
              >
                <XStack gap={'$2'} ai={'center'}>
                  {pickedCoinSymbol && <IconCoin symbol={pickedCoinSymbol} size={'$2'} />}
                  <Select.Value
                    testID={'SelectCoinValue'}
                    size={'$5'}
                    color={'$color12'}
                    placeholder={'Token'}
                  />
                </XStack>
              </Select.Trigger>

              <Adapt when="sm">
                <Sheet
                  native
                  modal
                  dismissOnSnapToBottom
                  snapPoints={snapPoints}
                  snapPointsMode={snapPointsMode}
                  disableDrag={!useFitContent}
                  animation="responsive"
                >
                  <Sheet.Frame px="$2" maw="100%" bc={'$color1'} py={'$6'}>
                    <XStack ai="center" jc="space-between" w="100%" px="$4">
                      <Paragraph fontSize={'$5'} fontWeight={'700'} color={'$color12'}>
                        Select Currency
                      </Paragraph>
                    </XStack>
                    <ScrollView showsVerticalScrollIndicator={false}>
                      <Adapt.Contents />
                    </ScrollView>
                  </Sheet.Frame>
                  <Sheet.Overlay
                    animation="200ms"
                    enterStyle={{ opacity: 0 }}
                    exitStyle={{ opacity: 0 }}
                    animateOnly={['opacity']}
                    opacity={0.4}
                  />
                </Sheet>
              </Adapt>

              <Select.Content zIndex={200000}>
                <Select.Viewport
                  animation="responsive"
                  animateOnly={['transform', 'opacity']}
                  transformOrigin="right top"
                  enterStyle={{ opacity: 0, y: 0, scale: 0.9 }}
                  exitStyle={{ opacity: 0, y: 0, scale: 0.9 }}
                  disableScroll
                  backgroundColor={'$color1'}
                  btrr={0}
                  boc="transparent"
                  x={'-50%'}
                  $lg={{
                    x: 0,
                  }}
                  br={'$6'}
                  overflow={'hidden'}
                  elevation="$3"
                  shadowOpacity={0.1}
                  opacity={0.95}
                >
                  <XStack
                    als="flex-start"
                    w="100%"
                    boc={'transparent'}
                    f={1}
                    miw={300}
                    maxHeight={isTouchable ? 'unset' : 275}
                    // @ts-expect-error - overflowY is needed for Y-axis specific scroll behavior
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
          <FieldError message={error?.message} />
        </Fieldset>
      </Theme>
    )
  }
)

CoinField.displayName = 'CoinField'
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
      focusStyle={{ backgroundColor: '$aztec4' }}
      hoverStyle={{ backgroundColor: '$aztec4' }}
      px="$3"
      py="$2"
    >
      <XStack gap="$2.5" $gtLg={{ gap: '$3.5' }} ai={'center'} jc={'space-between'}>
        <IconCoin size="$1.5" symbol={coin.symbol} />
        <Select.ItemText fontSize="$5" color="$gray11" lineHeight={36}>
          {coin.symbol}
        </Select.ItemText>
        {active && <Check size="$1" color={'$primary'} $theme-light={{ color: '$color12' }} />}
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
    <Paragraph fontSize="$5" color="$gray12">
      {formatAmount((Number(balance) / 10 ** decimals).toString())}
    </Paragraph>
  )
}
