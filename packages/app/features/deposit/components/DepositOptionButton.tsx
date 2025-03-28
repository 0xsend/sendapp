import { FadeCard, Paragraph, XStack, YStack } from '@my/ui'
import { ChevronRight } from '@tamagui/lucide-icons'
import { Link } from 'solito/link'
import type { NamedExoticComponent } from 'react'
import type { IconProps } from '@tamagui/helpers-icon'
import { useHoverStyles } from 'app/utils/useHoverStyles'

interface DepositOptionButtonProps {
  title: string
  description: string
  href: string
  Icon: NamedExoticComponent<IconProps>
}

export function DepositOptionButton({ title, description, Icon, href }: DepositOptionButtonProps) {
  const hoverStyles = useHoverStyles()

  return (
    <Link href={href}>
      <FadeCard hoverStyle={hoverStyles}>
        <XStack ai={'center'} jc={'space-between'}>
          <XStack gap={'$5'} ai={'center'} f={1}>
            <Icon
              size={'$2'}
              flexShrink={0}
              color={'$primary'}
              $theme-light={{
                color: '$color12',
              }}
            />
            <YStack f={1} gap={'$2'}>
              <Paragraph fontSize={'$6'} fontWeight={500}>
                {title}
              </Paragraph>
              <Paragraph
                fontSize={'$5'}
                color={'$lightGrayTextField'}
                $theme-light={{ color: '$darkGrayTextField' }}
                width={'100%'}
              >
                {description}
              </Paragraph>
            </YStack>
          </XStack>
          <ChevronRight
            size={'$1'}
            color={'$lightGrayTextField'}
            $theme-light={{ color: '$darkGrayTextField' }}
          />
        </XStack>
      </FadeCard>
    </Link>
  )
}
