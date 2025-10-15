// In a new file: components/DistributionSelect.tsx
import {
  Adapt,
  Button,
  Paragraph,
  ScrollView,
  Select,
  type SelectItemProps,
  Sheet,
  XStack,
} from '@my/ui'
import { Check, ChevronDown, ChevronUp } from '@tamagui/lucide-icons'
import { memo, useRef, useState } from 'react'
import type { UseDistributionsResultData } from 'app/utils/distributions'
import { IconX } from 'app/components/icons'
import { Platform } from 'react-native'
import { useThemeName } from 'tamagui'

const DistributionItem = ({
  isActive,
  value,
  index,
  children,
  ...props
}: {
  isActive: boolean
} & SelectItemProps) => {
  return (
    <Select.Item
      index={index}
      value={value}
      bc="transparent"
      f={1}
      w="100%"
      p={'$2'}
      m={0}
      style={{
        minHeight: 'unset',
      }}
      {...props}
    >
      <XStack gap={'$3.5'} f={1} ai={'center'} jc={'center'}>
        <Select.ItemText
          display="flex"
          fontSize={'$5'}
          fontWeight={'700'}
          color={isActive ? '$color12' : '$color10'}
          jc={'center'}
          ai={'center'}
        >
          {children}
        </Select.ItemText>
        {isActive && <Check size="$1" color={'$primary'} $theme-light={{ color: '$color12' }} />}
      </XStack>
    </Select.Item>
  )
}

interface DistributionSelectProps {
  distributions: UseDistributionsResultData
  selectedIndex: number
  onValueChange: (value: string) => void
}

export const DistributionSelect = memo(
  ({ distributions, selectedIndex, onValueChange }: DistributionSelectProps) => {
    const [isOpen, setIsOpen] = useState(false)
    const selectTriggerRef = useRef<HTMLSelectElement>(null)
    const theme = useThemeName()
    const isDark = theme?.startsWith('dark')

    const distributionDates = distributions.map(
      (d) =>
        `${d.timezone_adjusted_qualification_end.toLocaleString('default', {
          month: 'long',
        })} ${d.timezone_adjusted_qualification_end.toLocaleString('default', { year: 'numeric' })}`
    )

    return (
      <Select
        native={false}
        value={selectedIndex.toString()}
        onValueChange={onValueChange}
        onOpenChange={setIsOpen}
        open={isOpen}
      >
        <Select.Trigger
          ref={selectTriggerRef}
          testID={'SelectDistributionDate'}
          br="$3"
          bw={'$1'}
          width={'$14'}
          boc={isOpen ? '$color1' : isDark ? '$primary' : '$black'}
          bc={isOpen ? '$color1' : 'transparent'}
          iconAfter={
            isOpen ? (
              <ChevronUp color={isDark ? '$color12' : '$color11'} />
            ) : (
              <ChevronDown color={isDark ? '$primary' : '$black'} />
            )
          }
        >
          <Select.Value
            testID={'SelectDistributionDateValue'}
            color={'$color12'}
            hoverStyle={{ color: '$color0' }}
            placeholder={distributions[selectedIndex]?.number}
          />
        </Select.Trigger>

        <Adapt when="sm" platform="touch">
          <Sheet
            native
            modal
            dismissOnSnapToBottom
            snapPoints={[30]}
            animation={'quick'}
            disableDrag
          >
            <Sheet.Frame maw={738} bc={'$color1'} p={'$5'}>
              {Platform.OS === 'web' && (
                <Sheet.Handle py="$5" f={1} bc="transparent" jc={'space-between'} opacity={1} m={0}>
                  <XStack ai="center" jc="space-between" w="100%" px="$4">
                    <Paragraph fontSize={'$5'} fontWeight={'700'} color={'$color12'}>
                      Select Month
                    </Paragraph>
                    <Button
                      chromeless
                      unstyled
                      icon={<IconX color={'$color12'} size={'$1.5'} />}
                      onPress={() => setIsOpen(false)}
                    />
                  </XStack>
                </Sheet.Handle>
              )}
              <ScrollView>
                <Adapt.Contents />
              </ScrollView>
            </Sheet.Frame>
            <Sheet.Overlay />
          </Sheet>
        </Adapt>

        <Select.Content zIndex={200000}>
          <Select.Viewport
            br={'$3'}
            style={{
              left: '66%',
            }}
            w={320}
            btrr={0}
            boc="transparent"
            bc={'$color1'}
            pt={'$5'}
          >
            <Select.Group>
              {distributions.map((distribution, i) => (
                <DistributionItem
                  key={distribution.number}
                  isActive={distribution.number === distributions[selectedIndex]?.number}
                  value={i.toString()}
                  index={i}
                >
                  {distributionDates[i]}
                </DistributionItem>
              ))}
            </Select.Group>
          </Select.Viewport>
        </Select.Content>
      </Select>
    )
  }
)

DistributionSelect.displayName = 'DistributionSelect'
