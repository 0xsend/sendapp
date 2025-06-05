import { H4, Paragraph, Stack } from '@my/ui'
import { TabScreenContainer } from 'apps-expo/components/layout/TabScreenContainer'

export default function ExploreScreen() {
  return (
    <TabScreenContainer>
      <Stack f={1} ai="center" jc="center" p="$4">
        <H4 mb="$4">ExploreScreen</H4>
        <Paragraph ta="center" color="$color10">
          ExploreScreen
        </Paragraph>
      </Stack>
    </TabScreenContainer>
  )
}
