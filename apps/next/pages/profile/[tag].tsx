import { ProfileScreen } from 'app/features/profile/screen'
import { HomeLayout } from 'app/features/home/layout.web'
import Head from 'next/head'
import { createPagesServerClient } from '@supabase/auth-helpers-nextjs'
import { NextPageWithLayout } from '../_app'
import { supabaseAdmin } from 'app/utils/supabase/admin'

export const Page: NextPageWithLayout = () => {
  return (
    <>
      <Head>
        <title>Send | Profile</title>
      </Head>
      <ProfileScreen />
    </>
  )
}

// Profile page is not protected, but we need to look up the user profile by tag in case we have to show a 404
export const getServerSideProps = async (ctx) => {
  const { tag } = ctx.params
  const { data, error } = await supabaseAdmin
    .from('profiles')
    .select('id, tag')
    .eq('tag', tag)
    .maybeSingle()

  if (!data) {
    return {
      notFound: true,
    }
  }

  // log user activity
  console.log(
    `${ctx.req.url} - ${ctx.req.headers['user-agent']}${
      ctx.req.headers['x-forwarded-for'] ? ` - ${ctx.req.headers['x-forwarded-for']}` : ''
    }`
  )

  return {
    props: {},
  }
}

Page.getLayout = (children) => <HomeLayout header="">{children}</HomeLayout>

export default Page
