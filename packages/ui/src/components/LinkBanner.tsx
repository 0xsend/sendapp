import { Card, type CardProps, H1, Paragraph, XStack, YStack } from 'tamagui'
import { Fade } from './Fade'
import { LinearGradient } from '@tamagui/linear-gradient'
import { ArrowRight } from '@tamagui/lucide-icons'
import { Link } from './Link'

export type LinkBannerProps = {
  href: string
  imgUrl: string
  title: string
  subtitle?: string
} & CardProps

export const LinkBanner = ({
  href,
  imgUrl,
  subtitle,
  title,
  backgroundPosition,
}: LinkBannerProps) => {
  return (
    <Fade>
      <Link href={href}>
        <Card
          w={'100%'}
          h={200}
          p={'$5'}
          jc={'flex-end'}
          $gtLg={{ p: '$7' }}
          backgroundImage={imgUrl}
          backgroundPosition={backgroundPosition || 'center'}
          backgroundRepeat={'no-repeat'}
          backgroundSize={'cover'}
          overflow={'hidden'}
          $gtSm={{ h: 300 }}
        >
          <LinearGradient
            start={[0, 0]}
            end={[0, 1]}
            fullscreen
            colors={['transparent', 'rgba(0,0,0,0.5)']}
          >
            <YStack position="absolute" top={0} left={0} bottom={0} right={0} />
          </LinearGradient>
          <YStack gap={'$2'}>
            <XStack gap={'$3'} jc={'space-between'} ai={'center'}>
              <H1 color={'$white'}>{title}</H1>
              {!subtitle && <ArrowRight size={'$3'} color={'$primary'} flexShrink={0} />}
            </XStack>
            {subtitle && (
              <XStack gap={'$3'} jc={'space-between'} ai={'center'}>
                <Paragraph w={'80%'} fontSize={'$5'} color={'$lightGrayTextField'}>
                  {subtitle}
                </Paragraph>
                <ArrowRight size={'$3'} color={'$primary'} flexShrink={0} />
              </XStack>
            )}
          </YStack>
        </Card>
      </Link>
    </Fade>
  )
}
