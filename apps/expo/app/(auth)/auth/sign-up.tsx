import { SignUpScreen } from 'app/features/auth/sign-up/screen'
import { AuthLayout } from 'app/features/auth/layout'

export default function Screen() {
  return (
    <AuthLayout>
      <SignUpScreen />
    </AuthLayout>
  )
}
