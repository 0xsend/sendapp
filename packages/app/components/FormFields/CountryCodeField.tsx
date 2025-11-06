import { LinearGradient } from '@tamagui/linear-gradient'
import { Check, ChevronDown, ChevronUp } from '@tamagui/lucide-icons'
import { useTsController } from '@ts-react/form'
import { countries, type Country } from 'app/utils/country'
import { useGeoIp } from 'app/utils/useGeoIp'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { FlatList, type ListRenderItem } from 'react-native'
import {
  Adapt,
  Fieldset,
  Select,
  type SelectProps,
  Sheet,
  Text,
  Theme,
  useThemeName,
  XStack,
  YStack,
} from '@my/ui'

const ITEM_HEIGHT = 56

// Country item component for FlatList
const CountryItem = ({
  country,
  onSelect,
  isSelected,
}: {
  country: Country
  onSelect: (country: Country) => void
  isSelected: boolean
  themeName: string
}) => {
  return (
    <XStack
      paddingHorizontal="$4"
      paddingVertical="$3"
      alignItems="center"
      backgroundColor={isSelected ? '$color4' : 'transparent'}
      pressStyle={{ backgroundColor: '$color3' }}
      onPress={() => onSelect(country)}
      cursor="pointer"
      height={ITEM_HEIGHT}
    >
      <Text fontSize="$4" flex={1}>
        {country.flag}&nbsp;+{country.dialCode} {country.name}
      </Text>
      {isSelected && <Check size={16} color="$color12" />}
    </XStack>
  )
}

export const CountryCodeField = ({
  native = false,
  ...props
}: Pick<SelectProps, 'size' | 'native'>) => {
  const [country, setCountry] = useState<(typeof countries)[number] | undefined>(undefined)
  const [isOpen, setIsOpen] = useState(false)
  const { data: geoData, isLoading } = useGeoIp()
  const { field, error } = useTsController<string>()
  const themeName = useThemeName()

  // set the country code based on geoip
  useEffect(() => {
    if (isLoading) return
    const _country = countries.find((country) => country.code === geoData?.country_code)
    if (!country) {
      setCountry(_country)
    }
  }, [geoData, isLoading, country])

  // set the field.value based on the country code
  useEffect(() => {
    if (!country?.dialCode || field.value === country.dialCode) return
    field.onChange(country.dialCode)
  }, [country?.dialCode, field])

  // FlatList callbacks
  const handleCountrySelect = useCallback((selectedCountry: Country) => {
    setCountry(selectedCountry)
    // Close the sheet by setting isOpen to false
    setIsOpen(false)
  }, [])

  const renderCountryItem: ListRenderItem<Country> = useCallback(
    ({ item }) => (
      <CountryItem
        country={item}
        onSelect={handleCountrySelect}
        isSelected={country?.code === item.code}
        themeName={themeName}
      />
    ),
    [country?.code, handleCountrySelect, themeName]
  )

  const keyExtractor = useCallback((item: Country) => item.code, [])

  const getItemLayout = useCallback(
    (data: ArrayLike<Country> | null | undefined, index: number) => ({
      length: ITEM_HEIGHT,
      offset: ITEM_HEIGHT * index,
      index,
    }),
    []
  )

  const countryOptions = useMemo(() => {
    return countries?.map((country, i) => {
      return (
        <Select.Item
          id={`dialCode-${country.code}`}
          index={i}
          key={country.name}
          value={country.name}
          cursor="pointer"
          theme={themeName}
        >
          <Select.ItemText>
            {country.flag}&nbsp;{country.dialCode} {isOpen && country.name}
          </Select.ItemText>
          <Select.ItemIndicator marginLeft="auto">
            <Check size={16} />
          </Select.ItemIndicator>
        </Select.Item>
      )
    })
  }, [themeName, isOpen])

  return (
    <Theme name={error ? 'red' : themeName} forceClassName>
      <Fieldset>
        <Select
          open={isOpen}
          native={native}
          autoComplete="tel-country-code"
          onOpenChange={setIsOpen}
          onValueChange={(val) => {
            const _country = countries.find((country) => country.name === val)
            if (!_country) throw new Error('Country not found')
            setCountry(_country)
          }}
          value={country ? country.name : undefined}
          {...props}
        >
          <Select.Trigger
            bc="$color4"
            theme={'gray'}
            br={12}
            borderWidth="$0"
            gap={'$2'}
            p={'$2'}
            minHeight={'auto'}
          >
            {country ? (
              <Text
                fontSize="$5"
                fontFamily={'$mono'}
                style={{
                  textTransform: 'uppercase',
                }}
              >
                {country?.flag} +{country?.dialCode}
              </Text>
            ) : (
              <Text fontSize="$2" fontWeight="normal">
                Country
              </Text>
            )}
            <ChevronDown />
          </Select.Trigger>

          <Adapt platform="touch" when="sm">
            <Sheet open={isOpen} native modal dismissOnSnapToBottom disableDrag={true}>
              <Sheet.Frame>
                <YStack flex={1} paddingTop="$4">
                  <Text fontSize="$6" fontWeight="bold" paddingHorizontal="$4" paddingBottom="$3">
                    Select Country
                  </Text>
                  <FlatList
                    data={countries}
                    renderItem={renderCountryItem}
                    keyExtractor={keyExtractor}
                    getItemLayout={getItemLayout}
                    showsVerticalScrollIndicator={true}
                    bounces={false}
                    style={{ flex: 1 }}
                  />
                </YStack>
              </Sheet.Frame>
              <Sheet.Overlay />
            </Sheet>
          </Adapt>

          <Select.Content zIndex={200000}>
            <Select.ScrollUpButton
              alignItems="center"
              justifyContent="center"
              position="relative"
              width="100%"
            >
              <YStack zIndex={10}>
                <ChevronUp size={30} />
              </YStack>
              <LinearGradient
                start={[0, 0]}
                end={[0, 1]}
                fullscreen
                colors={['$background', '$backgroundHover']}
                borderRadius="$4"
              />
            </Select.ScrollUpButton>

            <Select.Viewport>
              <XStack>
                <Select.Group gap="$0">
                  <Select.Label>Select Country</Select.Label>
                  {countryOptions}
                </Select.Group>
              </XStack>
            </Select.Viewport>

            <Select.ScrollDownButton
              alignItems="center"
              justifyContent="center"
              position="relative"
              width="100%"
              height="$3"
            >
              <YStack zIndex={10}>
                <ChevronDown size={30} />
              </YStack>
              <LinearGradient
                start={[0, 0]}
                end={[0, 1]}
                fullscreen
                colors={['$backgroundHover', '$background']}
                borderRadius="$4"
              />
            </Select.ScrollDownButton>
          </Select.Content>
        </Select>
      </Fieldset>
    </Theme>
  )
}
