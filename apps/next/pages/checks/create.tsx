import Head from 'next/head'
import { userProtectedGetSSP } from 'utils/userProtected'
import type { NextPageWithLayout } from '../_app'
import { CreateSendCheck } from 'app/features/checks/components/create/CreateSendCheck'

export const CreateSendCheckPage: NextPageWithLayout = () => {
  return (
    <>
      <Head>
        <title>Send | Checks</title>
      </Head>
      <CreateSendCheck />
    </>
  )
}

export const getServerSideProps = userProtectedGetSSP()
export default CreateSendCheckPage
