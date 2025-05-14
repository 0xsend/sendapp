import { LinearGradient } from '@tamagui/linear-gradient'
import { Check, ChevronDown, ChevronUp } from '@tamagui/lucide-icons'
import { useTsController } from '@ts-react/form'
import { countries } from 'app/utils/country'
import { useGeoIp } from 'app/utils/useGeoIp'
import { useEffect, useMemo, useState } from 'react'
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
  }, [country?.dialCode, field.onChange, field.value])

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
            <Sheet native modal dismissOnSnapToBottom>
              <Sheet.Frame>
                <Sheet.ScrollView>
                  <Adapt.Contents />
                </Sheet.ScrollView>
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
