import { useState } from 'react'
import {
  Button,
  Container,
  H1,
  Paragraph,
  XStack,
  YStack,
} from '@my/ui'
import { MainLayout } from 'app/components/layout'
import { IconEthereum } from 'app/components/icons/IconEthereum'
import { Select } from './components/select'
import { NumPad } from './components/numpad'
import { SendTagModal, SendItModal } from './components/send-modal'

const assets: IAsset[] = [
  { icon: <IconEthereum />, name: 'ETH' },
  { icon: <IconEthereum />, name: 'BSC' },
  { icon: <IconEthereum />, name: 'TRON' },
]

type ModalType = '' | 'send_tag' | 'send_it'

// mock data
const tags = [
  {
    name: 'John',
    avatar: 'https://s3-alpha-sig.figma.com/img/eb19/3f8f/977bdbf2f05c1a17618f3ce2e06626d5?Expires=1702252800&Signature=C1er2rIICnn8qt7OmAxLKSmjXz2WM3idiguTKKKlLIfo4JG-m1Pnp2yaQBiKC0BDsd2If5wOO-f5gpeBGVGr9loIJyrDl-lgCd0LcSCXrTQwzem4R48AoZI5Pj0bup3ktx-VivSWhABO182Bm72qZ5rEUVnhk~hhdXahYJ7lDS5zZRVuZyuQPD6uyh2ndYAUre2P2e~gOKbZwmWlIjvHyV04hoOKsaxy4a2EzXklSky9ufuMEnvmwser2PqjLEtDh4pNZC3eAWctu4S1lTg~w2vxVMFEr6Ff1ShrAjEuCWhHE80XmSOXbtUwUf9naKmp2EA0ccWTA8ymYchD78hIBQ__&Key-Pair-Id=APKAQ4GOSFWCVNEHN3O4'
  },
  {
    name: 'Damien',
    avatar: 'https://s3-alpha-sig.figma.com/img/a851/fe91/3718702dc113ede9f0812c65a867c043?Expires=1702252800&Signature=B8JD4aTdCCuSsXAjacmQafK~eS81YNg5LoktXvtTooxUneBnTSbHThu05-IrMUldc1BPvrdiR6cjIPG0tdeKzzPL8vVcnsrwzJNm3seEt8fEIK-h0-p4ddI-6gCjjisI6akj3DwNfVFro9Yj8mq-ANyAd9WlDiK3N0xgE928-bBTIdxWLPqFR1F0qP8jF5rsTHRnu1g8v2moC7iqpuP1MxSs3-VbZ-gKIhlSOWJUl6imfQZAq7naYFdladCT4MV5HN5H9Rpgb3kDv2q-F7rAIi7HGCOoC-blQZW8YHb9rGnIpKTykAXUcfZgVp3ckbZy7e9aO3-gJiL8LdM8jQzmmw__&Key-Pair-Id=APKAQ4GOSFWCVNEHN3O4'
  },
  {
    name: 'Elisha',
    avatar: 'https://s3-alpha-sig.figma.com/img/4133/975a/0b108534bd4dd4c0583a2af270bbad58?Expires=1702252800&Signature=mYVUhTB3oUN0sTjkMnCN1wJ4os~qnnX-YJAXLFoZ3SqrgzMbUC8Yw0Y-IgCMMae2KIgDgDx93gNKngn6QZmAtLlzqdDvwCHqEyNZPjALg7kwrvsAw3jKxnUQ-G1FyYbSkYO64cK23JHc2QzMpJawR3Cr-JX8KkSQ8c-W72ChrNVZSm6T9sYCmgsjFCk1RT8YIW6a888kcuqVd4L~unAEFQUYTFXSqSAi5Pb21L5aelzGFDpMeJfbQ~sP1i0YgIPqKrd2JlkkfEtbGDyOQkjKTlkbX39~8WPj~bZZ2ae5cE6nmq6sJ9dU2itEvx~WSbdhGaxdzJBbb0JTLCkNFp7n-g__&Key-Pair-Id=APKAQ4GOSFWCVNEHN3O4'
  },
  {
    name: 'Migrut',
    avatar: 'https://s3-alpha-sig.figma.com/img/e5f1/c231/96d9c17181e09c0c069fb92abf5dcd9b?Expires=1702252800&Signature=ZHy8auRkpijZs9Iv1LymJ7kRcl~mNBoBntRkx3q09rKroNMi7fNDItCRKYI7-z0VPiqpUPmdhpP4~getREore6Ga2wBJoIdb2CorG8fF6MzWhQv5HrsIapj3dvF~QYHm1RfP~GHiQ36aJCpHK6-CQuT8q7~MoCQMh1Hj7NmwatmHbziiyHkM0YP6YHmC88-PMm3rXtBduCH3ivRuusnCPqdHPIZJ9lmUrM5JvLWJMHj4dACXxV4F2js4BjHVqrpTl58WX4xmO3ngxOmZgDHATWln-SIxR65cAc5kshfFY93Tzt-~OFuYWlGhlSD~JkGXlzR5kZfu23Fbe27K-9sZng__&Key-Pair-Id=APKAQ4GOSFWCVNEHN3O4'
  },
  {
    name: 'Jane',
    avatar: 'https://s3-alpha-sig.figma.com/img/6891/b163/706b318f4281f7751f15952875b3da85?Expires=1702252800&Signature=SAS8B1bj6NLgHvJAYyFuf~hl8JaR2xn-7EECMZEYATHhpUs3offebZwhjijPs~zGkafqVR8MvA-bCnSDrSEftLpAVjRW7qx46qdGK-awyuPTFZ5Zp600rB~GrqrF0WWEp6ikTmuERBGgztMRjQZ2c03Pqgzx3Pgn8dJ6BgEZufysX4tieFYkNNjMp9zF9ccX1tWmoSrhNmK-dliY30MYq6wHzrf-OGsRDaGJKpOv08h8cYxStHZoDCkus1FUh6jHOPuAlxSL3QBxOz2kUhBKZRik6Yue1RRCey5ugXfbngwhtA3ToBdb~lOQJ4f8SLTRZEDbuFcFWEOnRe1cE3EgNg__&Key-Pair-Id=APKAQ4GOSFWCVNEHN3O4'
  },
  {
    name: 'BigBoss',
    avatar: 'https://avatars.githubusercontent.com/u/95193764?v=4'
  },
  {
    name: 'LeO',
    avatar: 'https://avatars.githubusercontent.com/u/101268960?v=4'
  }
]

export const SendScreen = () => {
  const [sendAmount, setSendAmount] = useState('0.25')
  const [currentModal, setCurrentModal] = useState<ModalType>('')

  return (
    <>
      <MainLayout>
        <Container>
          <YStack maw={316} pt={'$13'}>
            <XStack jc={'center'}>
              <H1 size={sendAmount.length > 4 ? sendAmount.length > 8 ? '$9' : '$12' : '$15'}>
                {Number(sendAmount).toLocaleString()}
              </H1>
              <XStack pos={'absolute'} r={0} space={'$1.5'}>
                <Paragraph theme={'alt2'}>Bal</Paragraph>
                <Paragraph fontWeight={'700'}>1.25</Paragraph>
              </XStack>
            </XStack>
            <XStack jc={'center'} mt={'$6'}>
              <Select items={assets} />
            </XStack>
            <NumPad value={sendAmount} setValue={setSendAmount} />
            <Button
              my={'$6'}
              py={'$6'}
              borderRadius={'$9'}
              bc={'$backgroundTransparent'}
              boc={'$borderColorFocus'}
              onPress={() => {
                setCurrentModal('send_tag')
              }}
            >
              <Paragraph size={'$6'} fontWeight={'700'}>
                Continue
              </Paragraph>
            </Button>
          </YStack>
        </Container>
      </MainLayout>
      <SendTagModal sendAmount={sendAmount} asset={assets[0]} tags={tags} showModal={currentModal === 'send_tag'} setCurrentModal={setCurrentModal} />
      <SendItModal sendAmount={sendAmount} asset={assets[0]} tag={tags[6]} showModal={currentModal === 'send_it'} setCurrentModal={setCurrentModal} />
    </>
  )
}
