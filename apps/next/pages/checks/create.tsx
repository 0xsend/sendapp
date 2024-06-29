import Head from 'next/head'
import { userProtectedGetSSP } from 'utils/userProtected'
import type { NextPageWithLayout } from '../_app'
import { CreateSendCheck } from 'app/features/checks/components/createSendCheck'

export const CreateSendCheckPage: NextPageWithLayout = () => {
  return (
    <>
      <Head>
        <title>/send Checks</title>
      </Head>
      <CreateSendCheck />
    </>
  )
}

export const getServerSideProps = userProtectedGetSSP()
export default CreateSendCheckPage
