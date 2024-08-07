import type { ClaimSendCheckPayload } from 'app/features/checks/types'
import { ClaimSendCheck } from 'app/features/checks/components/claim/ClaimSendCheck'
import { decodeClaimCheckUrl } from 'app/features/checks/utils/checkUtils'
import Head from 'next/head'
import { useEffect, useState } from 'react'
import { Text, XStack, useToastController } from '@my/ui'
import { useRouter } from 'solito/router'

export const ClaimSendCheckPage = (props: ClaimSendCheckPayload) => {
  const [claimCheckPayload, setClaimCheckPayload] = useState<ClaimSendCheckPayload>()

  const toast = useToastController()
  const router = useRouter()

  useEffect(() => {
    const payload = window.location.hash.substring(1)
    const claimCheckPayload: ClaimSendCheckPayload = decodeClaimCheckUrl(payload)
    setClaimCheckPayload(claimCheckPayload)
  }, [])

  const onSuccess = () => {
    toast.show('Successfully claimed /send check', { type: 'success' })
    setTimeout(() => {
      router.push('/')
    }, 1000)
  }

  const onError = (e: Error) => {
    console.log(e)
  }

  return (
    <>
      <Head>
        <title>Send | Claim Send Check</title>
      </Head>
      <XStack justifyContent="center">
        <Text mt="$4" fontWeight="bold" position="absolute" fontSize="$12">
          /send
        </Text>
      </XStack>

      {claimCheckPayload && (
        <ClaimSendCheck onSuccess={onSuccess} onError={onError} payload={claimCheckPayload} />
      )}
    </>
  )
}

export default ClaimSendCheckPage
