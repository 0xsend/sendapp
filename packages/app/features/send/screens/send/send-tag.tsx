import {
  AnimatePresence,
  Avatar,
  Button,
  Container,
  H4,
  Image,
  Input,
  Label,
  Link,
  Paragraph,
  ScrollView,
  Separator,
  SizableText,
  Spinner,
  Text,
  XStack,
  YStack,
  styled,
} from '@my/ui'
import { FormProvider } from 'react-hook-form'
import { IconCheck, IconClose, IconSearch } from 'app/components/icons'
import { useSubScreenContext, useTransferContext } from 'app/features/send/providers'
import { ANIMATE_DIRECTION_RIGHT, SendScreen } from 'app/features/send/types'
import { SearchSchema, TagSearchProvider, useTagSearch } from 'app/provider/tag-search'
import { SchemaForm } from 'app/utils/SchemaForm'

const CustomInput = styled(Input, {
  name: 'CustomInput',
  borderRadius: '$4',
  bg: '#081619',
  color: '$color12',
  placeholderTextColor: '$color12',
  borderWidth: 0,
  fontSize: '$4',
  width: '100%',
  height: '$4',
})

export const SendTagScreen = () => {
  const { setCurrentComponent } = useSubScreenContext()
  const { sendTo } = useTransferContext()

  return (
    <TagSearchProvider>
      <YStack
        gap={'$5'}
        px={'$5'}
        pt={'$size.8'}
        pb={'$7'}
        $shorter={{
          pt: '$8',
          pb: '$6',
        }}
      >
        <SizableText textTransform={'uppercase'} theme={'alt2'} color={'$color12'}>
          Search By
        </SizableText>
        <XStack ai={'center'}>
          <Search />
        </XStack>

        <TagsScreenBody />

        <XStack jc={'flex-end'} gap={'$6'}>
          <Button
            disabled={!sendTo}
            my={'$5'}
            py={'$5'}
            br={'$5'}
            w={'$13'}
            bc={'$primary'}
            boc={'$borderColorFocus'}
            onPress={() => setCurrentComponent([SendScreen.SEND_IT, ANIMATE_DIRECTION_RIGHT])}
          >
            <Paragraph color={'$background'} fontWeight={'700'} textTransform={'uppercase'}>
              Request
            </Paragraph>
          </Button>
          <Button
            disabled={!sendTo}
            my={'$5'}
            py={'$5'}
            br={'$5'}
            w={'$13'}
            bc={'$primary'}
            boc={'$borderColorFocus'}
            onPress={() => setCurrentComponent([SendScreen.SEND_IT, ANIMATE_DIRECTION_RIGHT])}
          >
            <Paragraph color={'$background'} fontWeight={'700'} textTransform={'uppercase'}>
              /Send
            </Paragraph>
          </Button>
        </XStack>
        {/* <Button
        pos={'absolute'}
        top={'$size.8'}
        right={'$5'}
        size="$2.5"
        circular
        bg={'$background05'}
        $shorter={{ top: '$size.4' }}
      >
        <Link href={'/'} display={'flex'}>
          <IconClose />
        </Link>
      </Button> */}
      </YStack>
    </TagSearchProvider>
  )
}

function TagsScreenBody() {
  const { isLoading, results, error } = useTagSearch()

  return (
    <AnimatePresence>
      {isLoading && (
        <YStack key="loading" space="$4" mb="$4">
          <Spinner size="large" color="$send1" />
        </YStack>
      )}

      {error && (
        <YStack key="error" space="$4" mb="$4">
          <H4 theme={'alt2'}>Error</H4>
          <Text>{error.message}</Text>
        </YStack>
      )}

      <SearchResults />
      {results === null && !isLoading && !error && (
        <YStack
          key="suggestions"
          animation="quick"
          space="$4"
          mb="$4"
          exitStyle={{
            opacity: 0,
            y: 10,
          }}
        >
          <Suggestions />
        </YStack>
      )}
    </AnimatePresence>
  )
}

function SearchResults() {
  const { form, results, isLoading, error } = useTagSearch()
  const { sendTo, setSendTo } = useTransferContext()
  const query = form.watch('query', '')

  if (!results || isLoading || error) {
    return null
  }

  return (
    <YStack
      testID="searchResults"
      key="searchResults"
      animation="quick"
      space="$4"
      mb="$4"
      enterStyle={{
        opacity: 0,
        y: -10,
      }}
    >
      <H4 theme={'alt2'}>Results</H4>
      {results.length === 0 && <Text>No results for {query}... 😢</Text>}
      {results.map((result) => (
        <Button
          key={`tag-${result.tag_name}`}
          jc={'flex-start'}
          ai={'center'}
          p={'$1.5'}
          gap={'$2'}
          h={56}
          backgroundColor={'#1C2A2D'}
          borderRadius={'$5'}
          onPress={() =>
            setSendTo({
              avatar: result.avatar_url,
              name: result.tag_name,
            })
          }
        >
          <XStack testID={`tag-search-${result.tag_name}`} ai="center" space="$4">
            {sendTo?.name === result.tag_name ? (
              <YStack w={'$4.5'} h={'$4.5'} br={'$3'} bc={'$primary'} jc={'center'} ai={'center'}>
                <IconCheck />
              </YStack>
            ) : (
              <Avatar size="$4.5" br="$3" space="$2">
                <Avatar.Image src={result.avatar_url} />
                <Avatar.Fallback>
                  <Avatar>
                    <Avatar.Image
                      src={`https://ui-avatars.com/api.jpg?name=${result.tag_name}&size=256`}
                    />
                    <Avatar.Fallback>
                      <Paragraph>??</Paragraph>
                    </Avatar.Fallback>
                  </Avatar>
                </Avatar.Fallback>
              </Avatar>
            )}
            <YStack gap={'$1.5'}>
              <SizableText color={'$white'} fontSize={'$5'} fontWeight={'500'}>
                {result.tag_name}
              </SizableText>
              <SizableText color={'$primary'} fontSize={'$2'} fontWeight={'400'}>
                @{result.tag_name}
              </SizableText>
            </YStack>
          </XStack>
        </Button>
      ))}
    </YStack>
  )
}

function Suggestions() {
  const { tags, sendTo, setSendTo } = useTransferContext()

  return (
    <>
      <SizableText textTransform={'uppercase'} theme={'alt2'} mb={'$5'}>
        Suggestions
      </SizableText>
      {/* <ScrollView fg={0} space={'$5'} showsHorizontalScrollIndicator={false}> */}
      <XStack flexWrap={'wrap'} gap={'$6'}>
        {tags.map((tag) => (
          <Button
            key={`tag-${tag.name}`}
            jc={'flex-start'}
            ai={'center'}
            p={'$1.5'}
            gap={'$2'}
            w={'calc(33.3% - 22px)'}
            h={56}
            backgroundColor={sendTo?.name === tag.name ? '$backgroundFocus' : '#1C2A2D'}
            borderRadius={'$5'}
            onPress={() => setSendTo(tag)}
          >
            {sendTo?.name === tag.name ? (
              <YStack w={'$4.5'} h={'$4.5'} br={'$3'} bc={'$primary'} jc={'center'} ai={'center'}>
                <IconCheck />
              </YStack>
            ) : (
              <Avatar size="$4.5" br="$3" space="$2">
                <Avatar.Image src={tag.avatar} />
                <Avatar.Fallback>
                  <Avatar>
                    <Avatar.Image
                      src={`https://ui-avatars.com/api.jpg?name=${tag.name}&size=256`}
                    />
                    <Avatar.Fallback>
                      <Paragraph>??</Paragraph>
                    </Avatar.Fallback>
                  </Avatar>
                </Avatar.Fallback>
              </Avatar>
            )}
            <YStack gap={'$1.5'}>
              <SizableText color={'$white'} fontSize={'$5'} fontWeight={'500'}>
                {tag.name}
              </SizableText>
              <SizableText color={'$primary'} fontSize={'$2'} fontWeight={'400'}>
                @{tag.name}
              </SizableText>
            </YStack>
          </Button>
        ))}
      </XStack>
      {/* </ScrollView> */}
    </>
  )
}

function Search() {
  const { form } = useTagSearch()
  return (
    <FormProvider {...form}>
      <SchemaForm
        form={form}
        defaultValues={{ query: '' }}
        onSubmit={() => {
          // noop
        }}
        schema={SearchSchema}
        props={{
          query: {
            placeholder: 'Search',
          },
        }}
        formProps={{
          width: '100%',
          f: 1,
          als: 'center',
          $gtSm: {
            maxWidth: '100%',
          },
        }}
      >
        {({ query }) => query}
      </SchemaForm>
    </FormProvider>
  )
}
