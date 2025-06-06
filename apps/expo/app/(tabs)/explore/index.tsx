import { Stack } from 'expo-router'
import { Link, Paragraph } from '@my/ui'
import { TabScreenContainer } from 'apps-expo/components/layout/TabScreenContainer'

export default function ExploreScreen() {
  return (
    <>
      <Stack.Screen
        options={{
          title: 'Explore',
        }}
      />
      <TabScreenContainer>
        <Paragraph>ExploreScreen</Paragraph>
        <Link href={'/rewards'}>rewards</Link>
        <Link href={'/sendpot'}>sendpot</Link>
        <Link href={'/feed'}>community feed</Link>
      </TabScreenContainer>
    </>
  )
}
