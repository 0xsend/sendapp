import type { ClaimSendCheckPayload } from 'app/features/checks/types'
import { ClaimSendCheck } from 'app/features/checks/components/claimSendCheck'
import { decodeClaimCheckUrl } from 'app/features/checks/utils/checkUtils'
import Head from 'next/head'
import type { GetUserOperationReceiptReturnType } from 'permissionless'
import { useEffect, useState } from 'react'

export const ClaimSendCheckPage = (props: ClaimSendCheckPayload) => {
  const [claimCheckPayload, setClaimCheckPayload] = useState<ClaimSendCheckPayload>()

  useEffect(() => {
    const payload = window.location.hash.substring(1)
    const claimCheckPayload: ClaimSendCheckPayload = decodeClaimCheckUrl(payload)
    setClaimCheckPayload(claimCheckPayload)
  }, [])

  const onSuccess = (receipt: GetUserOperationReceiptReturnType) => {
    console.log(receipt)
  }

  const onError = (e: Error) => {
    // TODO: implement onError
    console.log(e)
  }

  return (
    <>
      <Head>
        <title>Claim /send check</title>
      </Head>
      {/* TODO: implement loading state */}
      {/* TODO: implement error state */}
      {claimCheckPayload && (
        <ClaimSendCheck onSuccess={onSuccess} onError={onError} payload={claimCheckPayload} />
      )}
    </>
  )
}

export default ClaimSendCheckPage
