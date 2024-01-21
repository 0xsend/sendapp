import {
  Anchor,
  Card,
  Container,
  H4,
  Paragraph,
  SendLogo,
  SendLogoComplete,
  SendLogoCompleteLight,
  SendLogoLight,
  SubmitButton,
  Theme,
  XStack,
  YStack,
} from '@my/ui'
import { useThemeSetting } from '@tamagui/next-theme'
import { IconTelegramLogo, IconXLogo } from 'app/components/icons'
import { SchemaForm, formFields } from 'app/utils/SchemaForm'
import { api } from 'app/utils/api'
import React from 'react'
import { FormProvider, useForm } from 'react-hook-form'
import { useRouter } from 'solito/router'
import { z } from 'zod'
import { VerifyCode } from './components/VerifyCode'

export const SignInScreen = () => {
  return <></>
}
