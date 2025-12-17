import { useEffect, useState } from 'react'
import { Dialog, isWeb, Sheet, useMedia, YStack } from '@my/ui'
import type { WrappedData } from '../types'
import { Step1Welcome } from './steps/Step1Welcome'
import { Step2LetsGo } from 'app/features/wrapped/components/steps/Step2LetsGo'
import { Step3PeopleCount } from 'app/features/wrapped/components/steps/Step3PeopleCount'
import { Step4 } from 'app/features/wrapped/components/steps/Step4'
import { Step5 } from 'app/features/wrapped/components/steps/Step5'
import { Step6 } from 'app/features/wrapped/components/steps/Step6'
import { Step7 } from 'app/features/wrapped/components/steps/Step7'
import { Step8 } from 'app/features/wrapped/components/steps/Step8'
import { Step9 } from 'app/features/wrapped/components/steps/Step9'

interface WrappedDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  wrappedData: WrappedData
}

/**
 * WrappedDialog component
 *
 * Shows the wrapped experience in a dialog (desktop/tablet) or sheet (mobile)
 * Manages step navigation through the 5-step wrapped experience
 */
export function WrappedDialog({ open, onOpenChange }: WrappedDialogProps) {
  const media = useMedia()
  const isMobile = !isWeb || media.sm || false
  const [currentStep, setCurrentStep] = useState(1)
  const [isFullyOpen, setIsFullyOpen] = useState(false)

  useEffect(() => {
    if (open) {
      // Delay content rendering until sheet/dialog animation completes
      const timer = setTimeout(() => {
        setIsFullyOpen(true)
      }, 300)
      return () => clearTimeout(timer)
    }
    setIsFullyOpen(false)
  }, [open])

  const handleNext = () => {
    if (currentStep < 9) {
      setCurrentStep((prev) => prev + 1)
    }
  }

  const handleOpenChange = (newOpen: boolean) => {
    onOpenChange(newOpen)
    if (!newOpen) {
      // Reset to first step after closing
      setTimeout(() => setCurrentStep(1), 0)
    }
  }

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return <Step1Welcome onNext={handleNext} />
      case 2:
        return <Step2LetsGo onNext={handleNext} />
      case 3:
        return <Step3PeopleCount onNext={handleNext} />
      case 4:
        return <Step4 onNext={handleNext} />
      case 5:
        return <Step5 onNext={handleNext} />
      case 6:
        return <Step6 onNext={handleNext} />
      case 7:
        return <Step7 onNext={handleNext} />
      case 8:
        return <Step8 onNext={handleNext} />
      case 9:
        return <Step9 />
      default:
        return null
    }
  }

  // Use Sheet for mobile, Dialog for desktop/tablet
  if (isMobile) {
    return (
      <Sheet
        modal
        open={open}
        onOpenChange={handleOpenChange}
        snapPointsMode="fit"
        dismissOnSnapToBottom
      >
        <Sheet.Overlay animation="quick" enterStyle={{ opacity: 0 }} exitStyle={{ opacity: 0 }} />
        <Sheet.Frame padding="$6" paddingTop={0} gap="$4" backgroundColor="$background">
          <Sheet.Handle />
          <YStack gap="$4">{isFullyOpen && renderStep()}</YStack>
        </Sheet.Frame>
      </Sheet>
    )
  }

  return (
    <Dialog modal open={open} onOpenChange={handleOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay
          key="overlay"
          animation="quick"
          opacity={0.5}
          enterStyle={{ opacity: 0 }}
          exitStyle={{ opacity: 0 }}
        />
        <Dialog.Content
          key="content"
          bordered
          elevate
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
          width={450}
          padding="$6"
        >
          <YStack gap="$4">{renderStep()}</YStack>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog>
  )
}
