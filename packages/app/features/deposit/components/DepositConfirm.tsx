import { Button, FadeCard, Paragraph, Separator, SubmitButton, XStack, YStack } from '@my/ui'
import { useDepositScreenParams } from 'app/routers/params'
import { useRouter } from 'solito/router'

type DepositConfirmProps = {
  onConfirmTransaction: (amount: number) => void
  isLoading: boolean
}

export const DepositConfirm = ({ onConfirmTransaction, isLoading }: DepositConfirmProps) => {
  const router = useRouter()
  const [depositParams] = useDepositScreenParams()

  const parsedDepositAmount = Number(depositParams.depositAmount ?? '0') / 100
  const displayDepositAmount = parsedDepositAmount.toFixed(2)

  const handleSubmit = () => {
    if (!Number.isNaN(parsedDepositAmount)) {
      onConfirmTransaction(parsedDepositAmount)
    }
  }

  const handleEdit = () => {
    router.back()
  }

  return (
    <YStack f={1} gap="$5" jc={'space-between'}>
      <YStack gap="$5">
        <Paragraph size={'$7'}>Confirm Deposit Details</Paragraph>
        <FadeCard>
          <XStack ai={'center'} jc={'space-between'}>
            <Paragraph size={'$11'} fontWeight={500}>
              ${parsedDepositAmount}
            </Paragraph>
            <Button
              transparent
              chromeless
              backgroundColor="transparent"
              hoverStyle={{ backgroundColor: 'transparent' }}
              pressStyle={{ backgroundColor: 'transparent' }}
              focusStyle={{ backgroundColor: 'transparent' }}
              p={0}
              bw={0}
              height={'auto'}
              onPress={handleEdit}
            >
              <Button.Text size={'$5'} hoverStyle={{ color: '$primary' }}>
                edit
              </Button.Text>
            </Button>
          </XStack>
          <Separator boc={'$silverChalice'} $theme-light={{ boc: '$darkGrayTextField' }} />
          <YStack gap="$2">
            <Row label={'You pay'} value={`$${displayDepositAmount} USD`} />
            <Row label={'You receive'} value={`${displayDepositAmount} USDC`} />
          </YStack>
          <Separator boc={'$silverChalice'} $theme-light={{ boc: '$darkGrayTextField' }} />
          <Row label={'Fees'} value={'$0.00'} />
        </FadeCard>
      </YStack>
      <SubmitButton
        theme="green"
        onPress={handleSubmit}
        py={'$5'}
        br={'$4'}
        disabled={isLoading}
        disabledStyle={{ opacity: 0.5 }}
      >
        <Button.Text ff={'$mono'} fontWeight={'500'} tt="uppercase" size={'$5'} color={'$black'}>
          {isLoading ? 'processing...' : 'confirm deposit'}
        </Button.Text>
      </SubmitButton>
    </YStack>
  )
}

export const Row = ({ label, value }: { label: string; value: string }) => {
  return (
    <XStack gap={'$2.5'} jc={'space-between'} flexWrap={'wrap'}>
      <Paragraph
        size={'$5'}
        color={'$lightGrayTextField'}
        $theme-light={{ color: '$darkGrayTextField' }}
      >
        {label}
      </Paragraph>
      <XStack gap={'$2.5'} flexWrap={'wrap'} flexShrink={1}>
        <Paragraph size={'$5'}>{value}</Paragraph>
      </XStack>
    </XStack>
  )
}
