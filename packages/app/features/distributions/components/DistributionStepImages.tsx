import { Image, ImageProps } from '@my/ui'

import step1Img from 'app/assets/img/onboarding/connect-wallet.png'
import step2Img from 'app/assets/img/onboarding/send-tag.png'
import step3Img from 'app/assets/img/onboarding/sign.png'

const DistributionStepImage = (props: ImageProps) => (
  <Image
    height={'$10'}
    width={'$10'}
    mx="auto"
    resizeMode="cover"
    mb="$2"
    $gtXs={{ height: '$14', width: '$14', mb: '$4' }}
    $gtMd={{ height: '$12', width: '$12', mb: '$4' }}
    {...props}
  />
)

export const DistributionConnectImage = () => (
  <DistributionStepImage source={{ uri: step1Img.src }} />
)
export const DistributionRegisterImage = () => (
  <DistributionStepImage source={{ uri: step2Img.src }} />
)
export const DistributionSignImage = () => <DistributionStepImage source={{ uri: step3Img.src }} />
