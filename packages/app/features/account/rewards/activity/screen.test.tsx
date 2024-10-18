import { Wrapper } from 'app/utils/__mocks__/Wrapper'
import { ActivityRewardsScreen } from './screen'
import { act, render, screen } from '@testing-library/react-native'

jest.mock('app/utils/distributions', () => ({
  useMonthlyDistributions: () => ({
    data: [
      {
        number: 7,
        chain_id: 845337,
        qualification_end: Date.UTC(2024, 6, 15),
        distribution_shares: [
          {
            amount: 1,
            index: 1,
          },
        ],
        distribution_verifications_summary: [
          {
            tag_referrals: 123,
          },
        ],
      },
    ],
  }),
}))

jest.mock('app/routers/params', () => ({
  useRewardsScreenParams: () => [{ distributionNumber: 1 }, jest.fn()],
}))

jest.mock('app/utils/useChainAddresses', () => ({
  useChainAddresses: jest.fn().mockReturnValue({ data: { address: '0x123' } }),
}))
jest.mock('wagmi')
jest.mock('@web3modal/wagmi/react', () => ({
  useWeb3Modal: jest.fn().mockReturnValue({ open: jest.fn() }),
}))
jest.mock('@my/wagmi', () => ({
  __esModule: true,
  ...jest.requireActual('@my/wagmi'),
  baseMainnetClient: {
    chain: {
      id: 845337,
    },
    simulateContract: jest.fn().mockResolvedValue({}),
  },
  baseMainnetBundlerClient: {
    sendUserOperation: jest.fn(),
    waitForUserOperationReceipt: jest.fn().mockResolvedValue({ success: true }),
  },
  useReadSendTokenBalanceOf: jest.fn().mockReturnValue({
    data: 0n,
    isSuccess: true,
    error: null,
  }),
}))

jest.mock('app/utils/tags', () => ({
  useConfirmedTags: jest.fn().mockReturnValue({ data: [{ name: 'tag1' }, { name: 'tag2' }] }),
}))

jest.mock('app/utils/send-accounts', () => ({
  useSendAccount: jest.fn().mockReturnValue({
    data: {
      avatar_url: 'https://avatars.githubusercontent.com/u/123',
      name: 'test',
      about: 'test',
      refcode: 'test',
      tag: 'test',
      address: '0x123',
      phone: 'test',
      chain_id: 1,
      is_public: true,
      sendid: 1,
      all_tags: ['test'],
    },
  }),
}))

describe('ActivityRewardsScreen', () => {
  it('renders', async () => {
    jest.useFakeTimers()
    jest.setSystemTime(Date.UTC(2024, 6, 12))
    render(
      <Wrapper>
        <ActivityRewardsScreen />
      </Wrapper>
    )

    await act(async () => {
      jest.advanceTimersByTime(2000)
    })
    expect(screen.getByTestId('SelectDistributionDate')).toBeVisible()
    expect(screen.toJSON()).toMatchSnapshot('ActivityRewardsScreen')
  })
})
