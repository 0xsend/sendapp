import { Fade } from './Fade'
import { LinearGradient } from '@tamagui/linear-gradient'
import { ChevronRight } from '@tamagui/lucide-icons'
import { Link } from './Link'
import { SolitoImage } from 'solito/image'
import { useLink } from 'solito/link'
import { Platform } from 'react-native'
import { Card, type CardProps, Paragraph, useMedia, XStack, YStack } from '@my/ui'

export type LinkBannerProps = {
  href: string
  imgUrl: string
  title: string
  subtitle: string
} & CardProps

export const LinkBanner = ({ href, imgUrl, subtitle, title }: LinkBannerProps) => {
  const linkProps = useLink({ href })
  const media = useMedia()

  const content = (
    <Card
      elevation={'$0.75'}
      w={'100%'}
      h={200}
      br={'$6'}
      p={'$5'}
      jc={'space-between'}
      $gtLg={{ p: '$7' }}
      overflow={'hidden'}
      $gtSm={{ h: 300 }}
    >
      <Card.Background>
        <SolitoImage src={imgUrl} alt={title} resizeMode="cover" fill={true} />
      </Card.Background>
      <LinearGradient
        start={[0, 0]}
        end={[0, 1]}
        fullscreen
        colors={['transparent', 'rgba(0, 0, 0, 0.5)']}
      >
        <YStack position="absolute" top={0} left={0} bottom={0} right={0} />
      </LinearGradient>
      <YStack
        justifyContent={'center'}
        ai={'center'}
        backgroundColor={'rgba(102, 102, 102, 0.40)'}
        borderRadius={'$2'}
        backdropFilter={'blur(32px)'}
        alignSelf={'flex-start'}
      >
        <Paragraph
          fontSize={'$3'}
          color={'$white'}
          lineHeight={16}
          fontWeight={500}
          px={'$2'}
          py={'$1.5'}
          $gtLg={{ fontSize: '$4', fontWeight: 400, lineHeight: 20 }}
        >
          {title}
        </Paragraph>
      </YStack>
      <XStack gap={'$3'} jc={'space-between'} ai={'center'}>
        <Paragraph
          fontSize={'$8'}
          fontWeight={600}
          color={'$white'}
          lineHeight={32}
          $gtLg={{ fontSize: '$9', fontWeight: 500, lineHeight: 36 }}
        >
          {subtitle}
        </Paragraph>
        <ChevronRight size={media.gtLg ? '$3' : '$1'} flexShrink={0} color={'$white'} />
      </XStack>
    </Card>
  )

  if (Platform.OS === 'web') {
    return (
      <Fade>
        <Link href={href}>{content}</Link>
      </Fade>
    )
  }

  return <Fade {...linkProps}>{content}</Fade>
}
