import {
  Select,
  Adapt,
  Sheet,
  XStack,
  YStack,
  useThemeName,
  Fieldset,
  Theme,
  Text,
  SelectProps,
  Spinner,
} from 'tamagui'
import { Check, ChevronDown, ChevronUp } from '@tamagui/lucide-icons'
import { useGeoIp } from 'app/utils/useGeoIp'
import { countries } from 'app/utils/country'
import { LinearGradient } from '@tamagui/linear-gradient'
import { useEffect, useState } from 'react'
import { useTsController } from '@ts-react/form'

type SelectItem = {
  value: string
  name: string
}

export const CountryCodeField = ({
  options,
  native = false,
  ...props
}: {
  options: SelectItem[]
} & Pick<SelectProps, 'size' | 'native'>) => {
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
    if (!country) return
    field.onChange(country.dialCode)
  }, [country, field])

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
            f={1}
            iconAfter={ChevronDown}
            paddingTop={'unset'}
            paddingBottom={'unset'}
            space="$1"
            style={{
              border: '1px solid rgba(195, 171, 142, 0.6)',
            }}
            borderColor={'rgba(195, 171, 142, 0.6)'}
            borderWidth={1}
          >
            {isLoading ? (
              <Spinner color="$color" size="small" />
            ) : country ? (
              <Text
                fontSize="$1"
                fontWeight="bold"
                color="$text"
                style={{
                  textTransform: 'uppercase',
                }}
              >
                {country?.dialCode} {country?.flag}
              </Text>
            ) : (
              'Country'
            )}
          </Select.Trigger>

          <Adapt platform="web" when="sm">
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
                <ChevronUp size={44} />
              </YStack>
              <LinearGradient
                start={[0, 0]}
                end={[0, 1]}
                fullscreen
                colors={['$background', '$backgroundTransparent']}
                borderRadius="$4"
              />
            </Select.ScrollUpButton>

            <Select.Viewport>
              <XStack>
                <Select.Group space="$0">
                  <Select.Label>Country</Select.Label>
                  {countries.map((country, i) => {
                    return (
                      <Select.Item
                        id={`dialCode-${country.code}`}
                        index={i}
                        key={country.name}
                        value={country.name}
                        cursor="pointer"
                      >
                        <Select.ItemText>
                          {country.flag}&nbsp;{country.dialCode} {isOpen && country.name}
                        </Select.ItemText>
                        <Select.ItemIndicator marginLeft="auto">
                          <Check size={16} />
                        </Select.ItemIndicator>
                      </Select.Item>
                    )
                  })}
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
                <ChevronDown size={20} />
              </YStack>
              <LinearGradient
                start={[0, 0]}
                end={[0, 1]}
                fullscreen
                colors={['$backgroundTransparent', '$background']}
                borderRadius="$4"
              />
            </Select.ScrollDownButton>
          </Select.Content>
        </Select>
      </Fieldset>
    </Theme>
  )
}
