import {
  Button,
  Dialog,
  Input,
  Paragraph,
  PrimaryButton,
  Sheet,
  Spinner,
  useAppToast,
  useMedia,
  XStack,
  YStack,
  Text,
} from '@my/ui'
import { IconDollar, IconStar } from 'app/components/icons'
import { AlertTriangle, Ticket } from '@tamagui/lucide-icons'
import { useSendAccountBalances } from 'app/utils/useSendAccountBalances'
import { allCoins, type CoinWithBalance } from 'app/data/coins'
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
import { useHoverStyles } from 'app/utils/useHoverStyles'
import { OverlappingCoinIcons } from 'app/features/home/InvestmentsBalanceCard'
import { useSupabase } from 'app/utils/supabase/useSupabase'

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
  const hoverStyles = useHoverStyles()
  const supabase = useSupabase()

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

      // Sign out on the client side to update local session state
      await supabase.auth.signOut()

      // Navigate to home - the auth state change will trigger proper routing
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

  const renderWarningBanner = () => {
    return (
      <XStack
        gap="$3"
        p="$3"
        br="$4"
        backgroundColor="#DE474733"
        $theme-light={{ backgroundColor: '$red2' }}
        ai="center"
        borderWidth={1}
        borderColor={'$error'}
      >
        {step !== 'confirm' && <AlertTriangle size={20} color="$error" />}
        <Paragraph flex={1} fontSize="$4" color="$error">
          {step === 'confirm'
            ? "This action is permanent. You'll lose all access to your wallet, profile, history and any remaining assets. This cannot be undone."
            : 'Deleting your account is permanent.'}
        </Paragraph>
      </XStack>
    )
  }

  const renderStep = () => {
    switch (step) {
      case 'warning':
        return (
          <>
            <Paragraph fontSize="$7" fontWeight={500}>
              Delete your Send account
            </Paragraph>
            <YStack gap="$4" w="100%">
              {renderWarningBanner()}
              <Paragraph size="$4" color="$color4">
                You will permanently lose access to your profile, wallet and all features tied to
                your Send account.
              </Paragraph>
            </YStack>
            <YStack gap="$2" w="100%">
              <PrimaryButton
                flex={1}
                size="$4"
                height={44}
                p={0}
                onPress={handleContinue}
                disabled={isPending}
              >
                <PrimaryButton.Text fontSize="$5" textTransform={'none'} fontWeight={400}>
                  Continue
                </PrimaryButton.Text>
              </PrimaryButton>
              <Button
                flex={1}
                size="$4"
                height={44}
                onPress={handleCancel}
                disabled={isPending}
                pressStyle={{ o: 0.8 }}
              >
                <Button.Text fontSize="$5">Cancel</Button.Text>
              </Button>
            </YStack>
          </>
        )

      case 'funds':
        return (
          <>
            <Paragraph fontSize="$7" fontWeight={500}>
              You still have funds
            </Paragraph>
            <YStack gap="$4" w="100%">
              <YStack
                gap="$4"
                p="$5"
                pb={'$6'}
                br="$4"
                backgroundColor={hoverStyles.backgroundColor}
              >
                <Paragraph color="$color4">Balance</Paragraph>
                <XStack ai="center" justifyContent={'space-between'} gap="$2">
                  <Paragraph fontSize="$10" fontWeight="600" color="$color12" lineHeight={42}>
                    ${formatAmount(totalBalance, 9, 2)}
                  </Paragraph>
                  <OverlappingCoinIcons
                    coins={
                      balancesWithIcons.filter(Boolean).map((x) => x.coin) as CoinWithBalance[]
                    }
                  />
                </XStack>
              </YStack>
              <Paragraph size="$4" color="$color4">
                Send your funds before continuing. You won&apos;t be able to access them once the
                account is deleted.
              </Paragraph>
            </YStack>
            <YStack gap="$2" w="100%">
              <PrimaryButton
                flex={1}
                size="$4"
                onPress={handleContinue}
                disabled={isPending}
                height={44}
                p={0}
              >
                <PrimaryButton.Text fontSize="$5" textTransform={'none'} fontWeight={400}>
                  Continue
                </PrimaryButton.Text>
              </PrimaryButton>
              <Button
                flex={1}
                size="$4"
                onPress={handleCancel}
                disabled={isPending}
                pressStyle={{ o: 0.8 }}
              >
                <Button.Text fontSize="$5">Cancel</Button.Text>
              </Button>
            </YStack>
          </>
        )

      case 'assets':
        return (
          <>
            <Paragraph fontSize="$7" fontWeight={500}>
              You may have active assets
            </Paragraph>
            <YStack gap="$4">
              <XStack gap="$3" ai="center">
                <YStack
                  w={40}
                  h={40}
                  ai="center"
                  jc="center"
                  br="$4"
                  backgroundColor={hoverStyles.backgroundColor}
                >
                  <Ticket
                    size={20}
                    color="$primary"
                    $theme-light={{
                      color: '$color12',
                    }}
                  />
                </YStack>
                <YStack flex={1} gap="$1">
                  <Paragraph fontSize="$5">Sendpot tickets</Paragraph>
                  <Paragraph fontSize="$2" color="$color4">
                    Unused tickets won&apos;t carry over or be refunded
                  </Paragraph>
                </YStack>
              </XStack>
              <XStack gap="$4" ai="center">
                <YStack
                  w={40}
                  h={40}
                  ai="center"
                  jc="center"
                  br="$4"
                  backgroundColor={hoverStyles.backgroundColor}
                >
                  <IconStar
                    size="$1"
                    color="$primary"
                    $theme-light={{
                      color: '$color12',
                    }}
                  />
                </YStack>
                <YStack flex={1} gap="$1">
                  <Paragraph fontSize="$5">Unclaimed Rewards</Paragraph>
                  <Paragraph fontSize="$2" color="$color4">
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
                  backgroundColor={hoverStyles.backgroundColor}
                >
                  <IconDollar
                    size="$1.5"
                    color="$primary"
                    $theme-light={{
                      color: '$color12',
                    }}
                  />
                </YStack>
                <YStack flex={1} gap="$1">
                  <Paragraph fontSize="$5">Active savings</Paragraph>
                  <Paragraph fontSize="$2" color="$color4">
                    You may still have active earnings in your wallet
                  </Paragraph>
                </YStack>
              </XStack>
            </YStack>
            <Paragraph size="$4" color="$color4">
              Deleting your account is permanent. You won&apos;t be able to recover these assets.
            </Paragraph>
            <YStack gap="$2" w="100%">
              <PrimaryButton
                flex={1}
                size="$4"
                onPress={handleContinue}
                disabled={isPending}
                height={44}
                p={0}
              >
                <PrimaryButton.Text fontSize="$5" textTransform={'none'} fontWeight={400}>
                  Continue
                </PrimaryButton.Text>
              </PrimaryButton>
              <Button
                flex={1}
                size="$4"
                onPress={handleCancel}
                disabled={isPending}
                pressStyle={{ o: 0.8 }}
              >
                <Button.Text fontSize="$5">Cancel</Button.Text>
              </Button>
            </YStack>
          </>
        )

      case 'confirm':
        return (
          <>
            <Paragraph fontSize="$7" fontWeight={500}>
              Confirm account deletion
            </Paragraph>
            {renderWarningBanner()}
            <YStack gap="$2" w="100%">
              <Paragraph fontSize="$4" color="$color12">
                Type&nbsp;
                <Text fontSize="$4" color="$color12" fontWeight={600}>
                  DELETE
                </Text>
                &nbsp;to confirm
              </Paragraph>
              <Input
                size="$4"
                value={deleteConfirmation}
                onChangeText={setDeleteConfirmation}
                autoCapitalize="characters"
                autoCorrect={false}
                disabled={isPending}
                placeholder={'DELETE'}
                placeholderTextColor={'$color4'}
                borderColor={deleteConfirmation.toUpperCase() === 'DELETE' ? '$error' : undefined}
                focusStyle={{
                  borderColor: deleteConfirmation.toUpperCase() === 'DELETE' ? '$error' : undefined,
                }}
              />
            </YStack>
            <YStack gap="$2" w="100%">
              <Button
                flex={1}
                size="$4"
                backgroundColor="$red9"
                onPress={handleDelete}
                disabled={isPending || !isDeleteEnabled}
                pressStyle={{ o: 0.8 }}
                disabledStyle={{ opacity: 0.5 }}
                icon={isPending ? <Spinner size="small" color="$white" /> : undefined}
                hoverStyle={{
                  backgroundColor: '$red9',
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
              <Button
                flex={1}
                size="$4"
                onPress={handleCancel}
                disabled={isPending}
                pressStyle={{ o: 0.8 }}
              >
                <Button.Text fontSize="$5">Cancel</Button.Text>
              </Button>
            </YStack>
          </>
        )
    }
  }

  if (Platform.OS === 'web' && media.gtSm) {
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
            gap="$6"
            width={430}
            padding={'$6'}
          >
            {renderStep()}
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
      <Sheet.Frame key="account-deletion-sheet" gap="$6" padding="$6">
        {renderStep()}
      </Sheet.Frame>
      <Sheet.Overlay />
    </Sheet>
  )
}
