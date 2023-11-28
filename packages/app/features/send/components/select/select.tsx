import { Adapt, Select as TamaguiSelect, SelectProps, Sheet, YStack, getFontSize, XStack } from "@my/ui"
import { Check, ChevronDown, ChevronUp } from "@tamagui/lucide-icons"
import { LinearGradient } from '@tamagui/linear-gradient'
import { IconTriangleDown } from "app/components/icons/IconTriangleDown"
import { useMemo, useState } from "react"
import { IconProps } from "@tamagui/helpers-icon"

export function Select({ items, ...props }: SelectProps & { items: Array<{ icon?: React.ReactNode, name: string }> }) {
  const [val, setVal] = useState(items[0]?.name.toLowerCase())

  return (
    <TamaguiSelect
      value={val}
      onValueChange={setVal}
      disablePreventBodyScroll
      {...props}
    >
      <TamaguiSelect.Trigger w="auto" px={'$3.5'} bg={'$backgroundPress'} iconAfter={<IconTriangleDown width={12} height={'$0.75'} />}>
        <XStack space={'$1.5'}>
          {items.filter((item) => item.name.toLowerCase() === val)[0]?.icon}
          <TamaguiSelect.Value placeholder="Something" fow={'700'} />
        </XStack>
      </TamaguiSelect.Trigger>

      <Adapt when="sm" platform="touch">
        <Sheet
          native={!!props.native}
          modal
          dismissOnSnapToBottom
          animationConfig={{
            type: 'spring',
            damping: 20,
            mass: 1.2,
            stiffness: 250,
          }}
        >
          <Sheet.Frame>
            <Sheet.ScrollView>
              <Adapt.Contents />
            </Sheet.ScrollView>
          </Sheet.Frame>
          <Sheet.Overlay
            animation="lazy"
            enterStyle={{ opacity: 0 }}
            exitStyle={{ opacity: 0 }}
          />
        </Sheet>
      </Adapt>

      <TamaguiSelect.Content zIndex={200000}>
        <TamaguiSelect.ScrollUpButton
          alignItems="center"
          justifyContent="center"
          position="relative"
          width="100%"
          height="$3"
        >
          <YStack zIndex={10}>
            <ChevronUp size={20} />
          </YStack>
          <LinearGradient
            start={[0, 0]}
            end={[0, 1]}
            fullscreen
            colors={['$background', 'transparent']}
            borderRadius="$4"
          />
        </TamaguiSelect.ScrollUpButton>

        <TamaguiSelect.Viewport
          // to do animations:
          animation="quick"
          animateOnly={['transform', 'opacity']}
          enterStyle={{ o: 0, y: -10 }}
          exitStyle={{ o: 0, y: 10 }}
          minWidth={200}
        >
          <TamaguiSelect.Group>
            {/* <Select.Label>Fruits</Select.Label> */}
            {/* for longer lists memoizing these is useful */}
            {useMemo(
              () =>
                items.map((item, i) => {
                  return (
                    <TamaguiSelect.Item
                      debug="verbose"
                      index={i}
                      key={item.name}
                      value={item.name.toLowerCase()}
                    >
                      <XStack space={'$2'}>
                        <TamaguiSelect.Icon>
                          {item.icon}
                        </TamaguiSelect.Icon>
                        <TamaguiSelect.ItemText>
                          {item.name}
                        </TamaguiSelect.ItemText>
                      </XStack>
                      <TamaguiSelect.ItemIndicator marginLeft="auto">
                        <Check size={16} />
                      </TamaguiSelect.ItemIndicator>
                    </TamaguiSelect.Item>
                  )
                }),
              [items]
            )}
          </TamaguiSelect.Group>
          {/* Native gets an extra icon */}
          {props.native && (
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
              <ChevronDown size={getFontSize((props.size ?? '$true') as any)} />
            </YStack>
          )}
        </TamaguiSelect.Viewport>

        <TamaguiSelect.ScrollDownButton
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
            colors={['transparent', '$background']}
            borderRadius="$4"
          />
        </TamaguiSelect.ScrollDownButton>
      </TamaguiSelect.Content>
    </TamaguiSelect>
  )
}