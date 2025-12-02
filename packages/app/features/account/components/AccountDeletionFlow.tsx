import {
  Button,
  Dialog,
  H2,
  Input,
  Paragraph,
  Sheet,
  Spinner,
  useAppToast,
  useMedia,
  XStack,
  YStack,
} from '@my/ui'
import { IconCoin, IconDollar, IconStar, IconX } from 'app/components/icons'
import { AlertTriangle, Ticket } from '@tamagui/lucide-icons'
import { useSendAccountBalances } from 'app/utils/useSendAccountBalances'
import { allCoins } from 'app/data/coins'
import { useMemo, useRef, useState } from 'react'
import { Platform } from 'react-native'
import { api } from 'app/utils/api'
import { formatErrorMessage } from 'app/utils/formatErrorMessage'
import { useRouter } from 'solito/router'
import formatAmount from 'app/utils/formatAmount'
import { useSendAccount } from 'app/utils/send-accounts'
import { signChallenge } from 'app/utils/signChallenge'
import { webauthnCredToAllowedCredentials } from 'app/utils/signUserOp'
import { RecoveryOptions } from '@my/api/src/routers/account-recovery/types'
import { bytesToHex, hexToBytes } from 'viem'

interface AccountDeletionFlowProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

type DeletionStep = 'warning' | 'funds' | 'assets' | 'confirm'

export function AccountDeletionFlow({ open, onOpenChange }: AccountDeletionFlowProps) {
  const [step, setStep] = useState<DeletionStep>('warning')
  const [deleteConfirmation, setDeleteConfirmation] = useState('')
  const [isAuthenticating, setIsAuthenticating] = useState(false)
  const toast = useAppToast()
  const router = useRouter()
  const media = useMedia()

  const { dollarBalances } = useSendAccountBalances()
  const { data: sendAccount } = useSendAccount()

  const lastValidDollarBalance = useRef(dollarBalances)
  if (dollarBalances !== undefined) {
    lastValidDollarBalance.current = dollarBalances
  }

  const balances = lastValidDollarBalance.current ?? {}

  const totalBalance = Object.entries(balances).reduce(
    (total, [, balance]) => total + (balance as number),
    0
  )

  const balancesWithIcons = useMemo(() => {
    if (!balances || Object.keys(balances).length === 0) return []
    return Object.entries(balances)
      .filter(([, balance]) => (balance as number) > 0)
      .map(([token, balance]) => {
        const coin = allCoins.find((c) => c.token.toLowerCase() === token.toLowerCase())
        return { token, balance: balance as number, coin }
      })
      .filter((item) => item.coin)
      .slice(0, 3)
  }, [balances])

  const { mutateAsync: getChallenge } = api.challenge.getChallenge.useMutation({ retry: false })
  const { mutateAsync: validateSignature } = api.challenge.validateSignature.useMutation({
    retry: false,
  })

  const { mutateAsync: deleteAccount, isPending: isDeleting } = api.auth.deleteAccount.useMutation({
    onSuccess: async () => {
      toast.show('Account deleted successfully')
      onOpenChange(false)
      router.replace('/')
    },
    onError: (error) => {
      toast.error(formatErrorMessage(error))
      console.error('Failed to delete account:', error)
    },
  })

  const hasFunds = useMemo(() => {
    return totalBalance > 0
  }, [totalBalance])

  const webauthnCreds = useMemo(
    () =>
      sendAccount?.send_account_credentials
        ?.filter((c) => !!c.webauthn_credentials)
        ?.map((c) => c.webauthn_credentials as NonNullable<typeof c.webauthn_credentials>) ?? [],
    [sendAccount?.send_account_credentials]
  )

  const allowedCredentials = useMemo(
    () => webauthnCredToAllowedCredentials(webauthnCreds),
    [webauthnCreds]
  )

  const handleContinue = () => {
    if (step === 'warning') {
      if (hasFunds) {
        setStep('funds')
      } else {
        setStep('assets')
      }
    } else if (step === 'funds') {
      setStep('assets')
    } else if (step === 'assets') {
      setStep('confirm')
    }
  }

  const handleDelete = async () => {
    if (deleteConfirmation.toUpperCase() !== 'DELETE') return

    setIsAuthenticating(true)
    try {
      const challengeData = await getChallenge()

      const { encodedWebAuthnSig, accountName, keySlot } = await signChallenge(
        challengeData.challenge as `0x${string}`,
        allowedCredentials
      )

      const encodedWebAuthnSigBytes = hexToBytes(encodedWebAuthnSig)
      const newEncodedWebAuthnSigBytes = new Uint8Array(encodedWebAuthnSigBytes.length + 1)
      newEncodedWebAuthnSigBytes[0] = keySlot
      newEncodedWebAuthnSigBytes.set(encodedWebAuthnSigBytes, 1)

      await validateSignature({
        recoveryType: RecoveryOptions.WEBAUTHN,
        signature: bytesToHex(newEncodedWebAuthnSigBytes),
        challengeId: challengeData.id,
        identifier: `${accountName}.${keySlot}`,
      })

      await deleteAccount()
    } catch (error) {
      console.error('Failed to delete account:', error)
      toast.error(formatErrorMessage(error))
    } finally {
      setIsAuthenticating(false)
    }
  }

  const handleClose = (isOpen: boolean) => {
    onOpenChange(isOpen)
    if (!isOpen) {
      setTimeout(() => {
        setStep('warning')
        setDeleteConfirmation('')
      }, 300)
    }
  }

  const handleCancel = () => {
    handleClose(false)
  }

  const isPending = isDeleting || isAuthenticating
  const isDeleteEnabled = deleteConfirmation.toUpperCase() === 'DELETE'

  const renderWarningBanner = () => (
    <XStack
      gap="$3"
      p="$3"
      br="$4"
      backgroundColor="$red3"
      $theme-light={{ backgroundColor: '$red2' }}
      ai="center"
    >
      <AlertTriangle size={20} color="$red11" />
      <Paragraph flex={1} fontSize="$4" color="$red11" fontWeight="500">
        {step === 'warning' || step === 'confirm'
          ? 'Deleting your account is permanent.'
          : "This action is permanent. You'll lose all access to your wallet, profile, history and any remaining assets. This cannot be undone."}
      </Paragraph>
    </XStack>
  )

  const renderStep = () => {
    switch (step) {
      case 'warning':
        return (
          <>
            <H2 fontSize="$7" ta="center">
              Delete your Send account
            </H2>
            {renderWarningBanner()}
            <Paragraph ta="center" size="$4" color="$color11">
              You will permanently lose access to your profile, wallet and all features tied to your
              Send account.
            </Paragraph>
            <XStack gap="$3" w="100%">
              <Button
                flex={1}
                size="$4"
                onPress={handleCancel}
                disabled={isPending}
                pressStyle={{ o: 0.8 }}
              >
                <Button.Text fontSize="$5">Cancel</Button.Text>
              </Button>
              <Button
                flex={1}
                size="$4"
                backgroundColor="$color12"
                onPress={handleContinue}
                disabled={isPending}
                pressStyle={{ o: 0.8 }}
                hoverStyle={{ backgroundColor: '$color11' }}
              >
                <Button.Text fontSize="$5" color="$color1">
                  Continue
                </Button.Text>
              </Button>
            </XStack>
          </>
        )

      case 'funds':
        return (
          <>
            <H2 fontSize="$7" ta="center">
              You still have funds
            </H2>
            <YStack
              gap="$2"
              p="$4"
              br="$4"
              backgroundColor="$color3"
              $theme-light={{ backgroundColor: '$color2' }}
            >
              <Paragraph fontSize="$5" fontWeight="600" color="$color12">
                Balance
              </Paragraph>
              <XStack ai="center" gap="$2">
                <Paragraph fontSize="$8" fontWeight="700" color="$color12">
                  ${formatAmount(totalBalance, 9, 0)}
                </Paragraph>
                <XStack gap="$1" ai="center">
                  {balancesWithIcons.map((item) => {
                    if (!item.coin) return null
                    return <IconCoin key={item.token} symbol={item.coin.symbol} size={20} />
                  })}
                </XStack>
              </XStack>
            </YStack>
            <Paragraph ta="center" size="$4" color="$color11">
              Send your funds before continuing. You won&apos;t be able to access them once the
              account is deleted.
            </Paragraph>
            <XStack gap="$3" w="100%">
              <Button
                flex={1}
                size="$4"
                onPress={handleCancel}
                disabled={isPending}
                pressStyle={{ o: 0.8 }}
              >
                <Button.Text fontSize="$5">Cancel</Button.Text>
              </Button>
              <Button
                flex={1}
                size="$4"
                backgroundColor="$color12"
                onPress={handleContinue}
                disabled={isPending}
                pressStyle={{ o: 0.8 }}
                hoverStyle={{ backgroundColor: '$color11' }}
              >
                <Button.Text fontSize="$5" color="$color1">
                  Continue
                </Button.Text>
              </Button>
            </XStack>
          </>
        )

      case 'assets':
        return (
          <>
            <H2 fontSize="$7" ta="center">
              You may have active assets
            </H2>
            <YStack gap="$3">
              <XStack gap="$3" ai="center">
                <YStack
                  w={40}
                  h={40}
                  ai="center"
                  jc="center"
                  br="$4"
                  backgroundColor="$color3"
                  $theme-light={{ backgroundColor: '$color2' }}
                >
                  <Ticket size={20} color="$color12" />
                </YStack>
                <YStack flex={1} gap="$1">
                  <Paragraph fontSize="$5" fontWeight="600" color="$color12">
                    Sendpot tickets
                  </Paragraph>
                  <Paragraph fontSize="$3" color="$color11">
                    Unused tickets won&apos;t carry over or be refunded
                  </Paragraph>
                </YStack>
              </XStack>

              <XStack gap="$3" ai="center">
                <YStack
                  w={40}
                  h={40}
                  ai="center"
                  jc="center"
                  br="$4"
                  backgroundColor="$color3"
                  $theme-light={{ backgroundColor: '$color2' }}
                >
                  <IconStar size="$1" color="$color12" />
                </YStack>
                <YStack flex={1} gap="$1">
                  <Paragraph fontSize="$5" fontWeight="600" color="$color12">
                    Unclaimed Rewards
                  </Paragraph>
                  <Paragraph fontSize="$3" color="$color11">
                    You may still have unclaimed rewards in your wallet
                  </Paragraph>
                </YStack>
              </XStack>

              <XStack gap="$3" ai="center">
                <YStack
                  w={40}
                  h={40}
                  ai="center"
                  jc="center"
                  br="$4"
                  backgroundColor="$color3"
                  $theme-light={{ backgroundColor: '$color2' }}
                >
                  <IconDollar size="$1" color="$color12" />
                </YStack>
                <YStack flex={1} gap="$1">
                  <Paragraph fontSize="$5" fontWeight="600" color="$color12">
                    Active savings
                  </Paragraph>
                  <Paragraph fontSize="$3" color="$color11">
                    You may still have active earnings in your wallet
                  </Paragraph>
                </YStack>
              </XStack>
            </YStack>
            <Paragraph ta="center" size="$4" color="$color11">
              Deleting your account is permanent. You won&apos;t be able to recover these assets.
            </Paragraph>
            <XStack gap="$3" w="100%">
              <Button
                flex={1}
                size="$4"
                onPress={handleCancel}
                disabled={isPending}
                pressStyle={{ o: 0.8 }}
              >
                <Button.Text fontSize="$5">Cancel</Button.Text>
              </Button>
              <Button
                flex={1}
                size="$4"
                backgroundColor="$color12"
                onPress={handleContinue}
                disabled={isPending}
                pressStyle={{ o: 0.8 }}
                hoverStyle={{ backgroundColor: '$color11' }}
              >
                <Button.Text fontSize="$5" color="$color1">
                  Continue
                </Button.Text>
              </Button>
            </XStack>
          </>
        )

      case 'confirm':
        return (
          <>
            <H2 fontSize="$7" ta="center">
              Confirm account deletion
            </H2>
            {renderWarningBanner()}
            <YStack gap="$2" w="100%">
              <Paragraph fontSize="$4" color="$color12">
                Type 'DELETE' to confirm
              </Paragraph>
              <Input
                size="$4"
                placeholder="DELETE"
                value={deleteConfirmation}
                onChangeText={setDeleteConfirmation}
                autoCapitalize="characters"
                autoCorrect={false}
                disabled={isPending}
              />
            </YStack>
            <XStack gap="$3" w="100%">
              <Button
                flex={1}
                size="$4"
                onPress={handleCancel}
                disabled={isPending}
                pressStyle={{ o: 0.8 }}
              >
                <Button.Text fontSize="$5">Cancel</Button.Text>
              </Button>
              <Button
                flex={1}
                size="$4"
                backgroundColor="$red8"
                onPress={handleDelete}
                disabled={isPending || !isDeleteEnabled}
                pressStyle={{ o: 0.8 }}
                icon={isPending ? <Spinner size="small" color="$white" /> : undefined}
                hoverStyle={{
                  backgroundColor: '$red9',
                }}
                $theme-light={{
                  backgroundColor: '$red11',
                }}
              >
                <Button.Text fontSize="$5" color="$white">
                  {isAuthenticating
                    ? 'Authenticating...'
                    : isDeleting
                      ? 'Deleting...'
                      : 'Delete Account'}
                </Button.Text>
              </Button>
            </XStack>
          </>
        )
    }
  }

  const dialogContent = (
    <>
      {renderStep()}
      {Platform.OS === 'web' && (
        <Dialog.Close asChild>
          <Button
            position="absolute"
            top="$3"
            right="$3"
            size="$2"
            circular
            icon={<IconX size={16} color="$color12" />}
            onPress={handleCancel}
          />
        </Dialog.Close>
      )}
    </>
  )

  if (Platform.OS === 'web' && media.gtMd) {
    return (
      <Dialog modal open={open} onOpenChange={handleClose}>
        <Dialog.Portal>
          <Dialog.Overlay
            key="overlay"
            animation="quick"
            opacity={0.5}
            enterStyle={{ opacity: 0 }}
            exitStyle={{ opacity: 0 }}
          />
          <Dialog.Content
            bordered
            elevate
            key="content"
            animateOnly={['transform', 'opacity']}
            animation={[
              'quick',
              {
                opacity: {
                  overshootClamping: true,
                },
              },
            ]}
            enterStyle={{ x: 0, y: -20, opacity: 0, scale: 0.9 }}
            exitStyle={{ x: 0, y: 10, opacity: 0, scale: 0.95 }}
            gap="$4"
            width="90%"
            maxWidth={500}
          >
            {dialogContent}
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog>
    )
  }

  return (
    <Sheet
      open={open}
      modal
      onOpenChange={handleClose}
      dismissOnSnapToBottom={!isPending}
      dismissOnOverlayPress={!isPending}
      native={Platform.OS !== 'web'}
      snapPoints={['fit']}
      snapPointsMode="fit"
    >
      <Sheet.Frame key="account-deletion-sheet" gap="$4" padding="$4" pb="$6">
        {dialogContent}
      </Sheet.Frame>
      <Sheet.Overlay />
    </Sheet>
  )
}
