import { Card, H1, Paragraph, XStack, YStack } from 'tamagui'
import { Fade } from './Fade'
import { LinearGradient } from '@tamagui/linear-gradient'
import { ArrowRight } from '@tamagui/lucide-icons'
import { Link } from './Link'

export type LinkBannerProps = { href: string; imgUrl: string; title: string; subtitle?: string }

export const LinkBanner = ({ href, imgUrl, subtitle, title }: LinkBannerProps) => {
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
          backgroundPosition={'center'}
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
          <XStack jc={'space-between'} ai={subtitle ? 'flex-end' : 'center'}>
            <YStack gap={'$2'}>
              <H1>{title}</H1>
              {subtitle && (
                <Paragraph
                  fontSize={'$5'}
                  color={'$lightGrayTextField'}
                  $theme-light={{ color: '$darkGrayTextField' }}
                >
                  {subtitle}
                </Paragraph>
              )}
            </YStack>
            <ArrowRight size={'$3'} color={'$primary'} />
          </XStack>
        </Card>
      </Link>
    </Fade>
  )
}
