import { HomeScreen } from 'app/features/home/screen'
import { HomeSideBarWrapper } from 'app/components/sidebar/HomeSideBar'
import Head from 'next/head'
import { userProtectedGetSSP } from 'utils/userProtected'
import { NextPageWithLayout } from './_app'
import { GetServerSidePropsContext } from 'next'
import { useRouter } from 'next/router'



export const Page: NextPageWithLayout = () => {
  let location = useRouter().pathname


  return (
    <>
      <Head>
        <title>Home</title>
      </Head>
      <HomeSideBarWrapper location={location} >
        <HomeScreen />
      </HomeSideBarWrapper >

    </>
  )
}
export const getServerSideProps = (ctx: GetServerSidePropsContext) => {
  setReferralCodeCookie(ctx)
  return userProtectedGetSSP()(ctx)
}

function setReferralCodeCookie(context: GetServerSidePropsContext) {
  // Read the 'code' query parameter from the request URL
  const referralCode = context.query.referral

  // Set the cookie on the client side if the referral code exists
  if (referralCode) {
    context.res.setHeader(
      'Set-Cookie',
      `referral=${referralCode}; Max-Age=${30 * 24 * 60 * 60}; Path=/; HttpOnly` // 30 days
    )
  }
}

export default Page
