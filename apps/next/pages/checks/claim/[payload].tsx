import type { ClaimSendCheckPayload } from 'app/features/checks/types'
import { ClaimSendCheck } from 'app/features/checks/components/claimSendCheck'
import { decodeClaimCheckUrl } from 'app/features/checks/utils/checkUtils'
import type { GetServerSidePropsContext } from 'next'
import Head from 'next/head'
import type { GetUserOperationReceiptReturnType } from 'permissionless'

export const ClaimSendCheckPage = (props: ClaimSendCheckPayload) => {
  console.log('claimSendCheckPayload', props)
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
      <ClaimSendCheck onSuccess={onSuccess} onError={onError} payload={props} />
    </>
  )
}

export const getServerSideProps = (context: GetServerSidePropsContext) => {
  const payload = context.params?.payload
  const claimSendCheckPayload: ClaimSendCheckPayload = decodeClaimCheckUrl(payload as string)

  return {
    props: claimSendCheckPayload,
  }
}

export default ClaimSendCheckPage
