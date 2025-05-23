import { OnboardingScreen } from 'app/features/auth/onboarding/screen'
import { AuthLayout } from 'app/features/auth/layout'

export default function Screen() {
  return (
    <AuthLayout>
      <OnboardingScreen />
    </AuthLayout>
  )
}
